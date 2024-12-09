import { v4 as uuidv4 } from 'uuid';
import { ObjectId } from 'mongodb';
import fs from 'fs';
import path from 'path';
import mime from 'mime-types';
import dbClient from '../utils/db.js';
import redisClient from '../utils/redis.js';
import Queue from 'bull';
import imageThumbnail from 'image-thumbnail';

const FOLDER_PATH = process.env.FOLDER_PATH || '/tmp/files_manager';
const fileQueue = new Queue('fileQueue');

class FilesController {
  static async postUpload(req, res) {
    const token = req.headers['x-token'];
    const { name, type, parentId = 0, isPublic = false, data } = req.body;

    if (!token) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const userId = await redisClient.get(`auth_${token}`);
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    if (!name) {
      return res.status(400).json({ error: 'Missing name' });
    }

    if (!type || !['folder', 'file', 'image'].includes(type)) {
      return res.status(400).json({ error: 'Missing type' });
    }

    if (type !== 'folder' && !data) {
      return res.status(400).json({ error: 'Missing data' });
    }

    const parentFile = parentId ? await dbClient.db.collection('files').findOne({ _id: ObjectId(parentId) }) : null;

    if (parentId && !parentFile) {
      return res.status(400).json({ error: 'Parent not found' });
    }

    if (parentFile && parentFile.type !== 'folder') {
      return res.status(400).json({ error: 'Parent is not a folder' });
    }

    const user = await dbClient.db.collection('users').findOne({ _id: ObjectId(userId) });
    if (!user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const fileDocument = {
      userId: userId,
      name: name,
      type: type,
      isPublic: isPublic,
      parentId: parentId,
      localPath: '',
    };

    if (type === 'folder') {
      await dbClient.db.collection('files').insertOne(fileDocument);
      return res.status(201).json(fileDocument);
    }

    const localPath = path.join(FOLDER_PATH, uuidv4());
    fs.mkdirSync(FOLDER_PATH, { recursive: true });
    fs.writeFileSync(localPath, Buffer.from(data, 'base64'));

    fileDocument.localPath = localPath;
    const result = await dbClient.db.collection('files').insertOne(fileDocument);
    const fileId = result.insertedId;

    // Add job to queue for thumbnail generation
    if (type === 'image') {
      fileQueue.add({ userId, fileId });
    }

    return res.status(201).json(fileDocument);
  }

  // ... other methods

  static async getFile(req, res) {
    const token = req.headers['x-token'] || null;
    const fileId = req.params.id;
    const size = req.query.size;

    const file = await dbClient.db.collection('files').findOne({ _id: ObjectId(fileId) });
    if (!file) {
      return res.status(404).json({ error: 'Not found' });
    }

    if (!file.isPublic && !token) {
      return res.status(404).json({ error: 'Not found' });
    }

    const userId = token ? await redisClient.get(`auth_${token}`) : null;
    if (!file.isPublic && (!userId || file.userId !== userId)) {
      return res.status(404).json({ error: 'Not found' });
    }

    if (file.type === 'folder') {
      return res.status(400).json({ error: "A folder doesn't have content" });
    }

    const localPath = size ? `${file.localPath}_${size}` : file.localPath;
    if (!fs.existsSync(localPath)) {
      return res.status(404).json({ error: 'Not found' });
    }

    const mimeType = mime.lookup(file.name);
    res.setHeader('Content-Type', mimeType);
    const fileContent = fs.readFileSync(localPath);
    return res.status(200).send(fileContent);
  }
}

export default FilesController;

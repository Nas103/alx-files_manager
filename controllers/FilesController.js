// controllers/FilesController.js
import { v4 as uuidv4 } from 'uuid';
import { ObjectId } from 'mongodb';
import fs from 'fs';
import path from 'path';
import mime from 'mime-types';
import dbClient from '../utils/db.js';
import redisClient from '../utils/redis.js';

const FOLDER_PATH = process.env.FOLDER_PATH || '/tmp/files_manager';

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
    await dbClient.db.collection('files').insertOne(fileDocument);

    return res.status(201).json(fileDocument);
  }
}

export default FilesController;

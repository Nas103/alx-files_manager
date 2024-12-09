import { MongoClient } from 'mongodb';
import dotenv from 'dotenv';

// Load environment variables from .env file
dotenv.config();

class DBClient {
  constructor() {
    const host = process.env.DB_HOST || 'localhost';
    const port = process.env.DB_PORT || 27017;
    const database = process.env.DB_DATABASE || 'files_manager';
    const url = `mongodb://${host}:${port}`;
    this.client = new MongoClient(url, { useUnifiedTopology: true });
    this.connected = false;

    this.client.connect((err) => {
      if (err) {
        console.error('MongoDB connection error:', err);
      } else {
        this.connected = true;
        this.db = this.client.db(database);
      }
    });
  }

  isAlive() {
    return this.connected;
  }

  async nbUsers() {
    if (!this.connected) return 0;
    try {
      return await this.db.collection('users').countDocuments();
    } catch (err) {
      console.error('Error counting users:', err);
      return 0;
    }
  }

  async nbFiles() {
    if (!this.connected) return 0;
    try {
      return await this.db.collection('files').countDocuments();
    } catch (err) {
      console.error('Error counting files:', err);
      return 0;
    }
  }
}

const dbClient = new DBClient();
export default dbClient;

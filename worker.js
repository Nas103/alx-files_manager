import Queue from 'bull';
import dbClient from './utils/db.js';

// Create the userQueue
const userQueue = new Queue('userQueue');

userQueue.process(async (job, done) => {
  const { userId } = job.data;

  if (!userId) {
    throw new Error('Missing userId');
  }

  const user = await dbClient.db.collection('users').findOne({ _id: ObjectId(userId) });
  if (!user) {
    throw new Error('User not found');
  }

  // Print welcome message to console
  console.log(`Welcome ${user.email}!`);
  done();
});

userQueue.on('completed', (job) => {
  console.log(`Job ${job.id} completed successfully`);
});

userQueue.on('failed', (job, err) => {
  console.log(`Job ${job.id} failed with error ${err}`);
});


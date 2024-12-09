import { expect } from 'chai';
import redisClient from '../utils/redis.js';

describe('redisClient', () => {
  it('should be connected to Redis', (done) => {
    redisClient.client.on('connect', () => {
      expect(redisClient.isAlive()).to.equal(true);
      done();
    });
  });

  it('should set and get values correctly', async () => {
    await redisClient.set('test_key', 'test_value', 10);
    const value = await redisClient.get('test_key');
    expect(value).to.equal('test_value');
  });

  it('should remove values correctly', async () => {
    await redisClient.set('test_key', 'test_value', 10);
    await redisClient.del('test_key');
    const value = await redisClient.get('test_key');
    expect(value).to.be.null;
  });
});

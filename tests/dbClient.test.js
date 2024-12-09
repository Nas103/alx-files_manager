import { expect } from 'chai';
import dbClient from '../utils/db.js';

describe('dbClient', () => {
  it('should be connected to MongoDB', (done) => {
    dbClient.client.on('connect', () => {
      expect(dbClient.isAlive()).to.equal(true);
      done();
    });
  });

  it('should count documents in users collection', async () => {
    const nbUsers = await dbClient.nbUsers();
    expect(nbUsers).to.be.a('number');
  });

  it('should count documents in files collection', async () => {
    const nbFiles = await dbClient.nbFiles();
    expect(nbFiles).to.be.a('number');
  });
});

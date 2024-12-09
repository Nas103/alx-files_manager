import chai from 'chai';
import chaiHttp from 'chai-http';
import app from '../server.js'; // Assuming your express app is exported from server.js or a similar file

chai.use(chaiHttp);
const { expect } = chai;

describe('API Endpoints', () => {
  it('GET /status should return status', (done) => {
    chai.request(app)
      .get('/status')
      .end((err, res) => {
        expect(res).to.have.status(200);
        expect(res.body).to.have.property('redis');
        expect(res.body).to.have.property('db');
        done();
      });
  });

  it('GET /stats should return stats', (done) => {
    chai.request(app)
      .get('/stats')
      .end((err, res) => {
        expect(res).to.have.status(200);
        expect(res.body).to.have.property('users');
        expect(res.body).to.have.property('files');
        done();
      });
  });

  it('POST /users should create a new user', (done) => {
    chai.request(app)
      .post('/users')
      .send({ email: 'test@example.com', password: 'password' })
      .end((err, res) => {
        expect(res).to.have.status(201);
        expect(res.body).to.have.property('id');
        expect(res.body).to.have.property('email');
        done();
      });
  });

  it('GET /connect should authenticate user', (done) => {
    chai.request(app)
      .get('/connect')
      .auth('test@example.com', 'password')
      .end((err, res) => {
        expect(res).to.have.status(200);
        expect(res.body).to.have.property('token');
        done();
      });
  });

  it('GET /disconnect should log out user', (done) => {
    chai.request(app)
      .get('/disconnect')
      .set('X-Token', 'valid_token')
      .end((err, res) => {
        expect(res).to.have.status(204);
        done();
      });
  });

  it('GET /users/me should return user info', (done) => {
    chai.request(app)
      .get('/users/me')
      .set('X-Token', 'valid_token')
      .end((err, res) => {
        expect(res).to.have.status(200);
        expect(res.body).to.have.property('id');
        expect(res.body).to.have.property('email');
        done();
      });
  });

  it('POST /files should upload a new file', (done) => {
    chai.request(app)
      .post('/files')
      .set('X-Token', 'valid_token')
      .send({ name: 'file.txt', type: 'file', data: 'Hello World' })
      .end((err, res) => {
        expect(res).to.have.status(201);
        expect(res.body).to.have.property('id');
        expect(res.body).to.have.property('name');
        done();
      });
  });

  it('GET /files/:id should return file info', (done) => {
    chai.request(app)
      .get('/files/5f1e8896c7ba06511e683b25')
      .set('X-Token', 'valid_token')
      .end((err, res) => {
        expect(res).to.have.status(200);
        expect(res.body).to.have.property('id');
        expect(res.body).to.have.property('name');
        done();
      });
  });

  it('GET /files should return a list of files with pagination', (done) => {
    chai.request(app)
      .get('/files?parentId=0&page=0')
      .set('X-Token', 'valid_token')
      .end((err, res) => {
        expect(res).to.have.status(200);
        expect(res.body).to.be.an('array');
        done();
      });
  });

  it('PUT /files/:id/publish should publish the file', (done) => {
    chai.request(app)
      .put('/files/5f1e8896c7ba06511e683b25/publish')
      .set('X-Token', 'valid_token')
      .end((err, res) => {
        expect(res).to.have.status(200);
        expect(res.body).to.have.property('isPublic', true);
        done();
      });
  });

  it('PUT /files/:id/unpublish should unpublish the file', (done) => {
    chai.request(app)
      .put('/files/5f1e8896c7ba06511e683b25/unpublish')
      .set('X-Token', 'valid_token')
      .end((err, res) => {
        expect(res).to.have.status(200);
        expect(res.body).to.have.property('isPublic', false);
        done();
      });
  });

  it('GET /files/:id/data should return file data', (done) => {
    chai.request(app)
      .get('/files/5f1e8896c7ba06511e683b25/data')
      .set('X-Token', 'valid_token')
      .end((err, res) => {
        expect(res).to.have.status(200);
        expect(res).to.have.header('content-type', 'text/plain; charset=utf-8');
        done();
      });
  });
});

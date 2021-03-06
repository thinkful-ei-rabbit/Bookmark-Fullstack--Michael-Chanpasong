/* eslint-disable quotes */
const { expect } = require('chai');
const knex = require('knex');
const supertest = require('supertest');
const app = require('../src/app');
const { makeBookmarksArray } = require('./bookmarks.fixtures');

describe('Bookmarks Endpoints', function () {
  let db;

  before('make knex instance', () => {
    db = knex({
      client: 'pg',
      connection: process.env.TEST_DB_URL,
    });
    //console.log(process.env.TEST_DB_URL);
    app.set('db', db);
  });

  after('disconnect from db', () => db.destroy());

  before('clean the table', () => db('bookmark_data').truncate());

  afterEach('cleanup', () => db('bookmark_data').truncate());

  describe(`GET /api/bookmarks`, () => {
    context('Given no bookmarks', () => {
      it(`responds with 200 and an empty list`, () => {
        return supertest(app).get('/api/bookmarks').set({'Authorization': `Bearer ${process.env.API_TOKEN}`}).expect(200, []);
      });
    });
    context('Given there are bookmarks in the database', () => {
      const testBookmarks = makeBookmarksArray();

      beforeEach('insert bookmarks', () => {
        return db
          .into('bookmark_data')
          .insert(testBookmarks);
      });

      it('responds with 200 and all of the bookmarks', () => {
        return supertest(app)
          .get('/api/bookmarks')
          .set({'Authorization': `Bearer ${process.env.API_TOKEN}`})
          .expect(200, testBookmarks);
      });
    });
  });

  describe(`GET /api/bookmarks/:bookmark_id`, () => {
    context('Given no bookmarks', () => {
      it('responds with 404', () => {
        const bookmarkId = 123456;
        return supertest(app).get(`/api/bookmarks/${bookmarkId}`)
          .set({'Authorization': `Bearer ${process.env.API_TOKEN}`})
          .expect(404, {error: {message: `Bookmark doesn't exist`}});
      });
    });
    context('Given there are bookmarks in the database', () => {
      const testBookmarks = makeBookmarksArray();

      beforeEach('insert bookmarks', () => {
        return db
          .into('bookmark_data')
          .insert(testBookmarks);
      });

      it('responds with 200 and the specified bookmark', () => {
        const bookmarkId = 5;
        const expectedBookmark = testBookmarks[bookmarkId - 1];
        return supertest(app)
          .get(`/api/bookmarks/${bookmarkId}`)
          .set({'Authorization': `Bearer ${process.env.API_TOKEN}`})
          .expect(200, expectedBookmark);
      });
    });
  });
  
  describe(`POST /api/bookmarks`, () => {
    it(`creates a bookmark, responding with 201 and the new bookmark`, function () {
      this.retries(3);
      const newBookmark = {
        title: 'Google',
        url: 'https://www.google.com/',
        rating: 5,
        description: 'World number one search engine from testing'
      };

      return supertest(app)
        .post('/api/bookmarks')
        .set({'Authorization': `Bearer ${process.env.API_TOKEN}`})
        .send(newBookmark)
        .expect(201)
        .expect(res => {
          expect(res.body.title).to.eql(newBookmark.title);
          expect(res.body.url).to.eql(newBookmark.url);
          expect(res.body.rating).to.eql(newBookmark.rating);
          expect(res.body.description).to.eql(newBookmark.description);
          expect(res.body).to.have.property('id');
          expect(res.headers.location).to.eql(`/api/bookmarks/${res.body.id}`);
        })
        .then(postRes =>
          supertest(app)
            .get(`/api/bookmarks/${postRes.body.id}`)
            .set({'Authorization': `Bearer ${process.env.API_TOKEN}`})
            .expect(postRes.body)
        );
    });

    const requiredFields = ['title', 'url', 'rating', 'description'];

    requiredFields.forEach(field => {
      const newBookmark = {
        title: 'test',
        url: 'https://www.test.com/',
        rating: 5,
        description: 'From testing'
      };

      it(`responds with 400 and an error message when the '${field}' is missing`, () => {
        delete newBookmark[field];

        return supertest(app)
          .post('/api/bookmarks')
          .set({'Authorization': `Bearer ${process.env.API_TOKEN}`})
          .send(newBookmark)
          .expect(400, {
            error: { message: `Missing '${field}' in request body` }
          });
      });
    });

    it(`It responses with 'Rating should be a number between 1 and 5' if incorrect`, () =>{
      const newBookmark = {
        title: 'test',
        url: 'https://www.test.com/',
        rating: 10,
        description: 'From testing'
      };
      return supertest(app).post('/api/bookmarks')
        .set({'Authorization': `Bearer ${process.env.API_TOKEN}`})
        .send(newBookmark)
        .expect(400, {
          error: { message: 'Rating should be a number between 1 and 5' }
        });
    });

    it(`It response with 'Url should include https://' if incorrect`, () =>{
      const newBookmark = {
        title: 'test',
        url: 'test.com/',
        rating: 3,
        description: 'From testing'
      };
      return supertest(app).post('/api/bookmarks')
        .set({'Authorization': `Bearer ${process.env.API_TOKEN}`})
        .send(newBookmark)
        .expect(400, {
          error: { message: 'Url should include proper https format' }
        });
    });
  });

  describe(`DELETE /api/bookmarks/:bookmark_id`, () => {
    context('Given there are bookmarks in the database', () => {
      const testBookmarks = makeBookmarksArray();

      beforeEach('insert bookmarks', () => {
        return db
          .into('bookmark_data')
          .insert(testBookmarks);
      });

      it('responds with 204 and removes the bookmark', () => {
        const idToRemove = 2;
        const expectedBookmarks = testBookmarks.filter(bookmark => bookmark.id !== idToRemove);
        return supertest(app)
          .delete(`/api/bookmarks/${idToRemove}`)
          .set({'Authorization': `Bearer ${process.env.API_TOKEN}`})
          .expect(204)
          .then(res =>
            supertest(app)
              .get(`/api/bookmarks`)
              .set({'Authorization': `Bearer ${process.env.API_TOKEN}`})
              .expect(expectedBookmarks)
          );
      });
    });
    context(`Given no bookmarks`, () => {
      it(`responds with 404`, () => {
        const bookmarkId = 123456;
        return supertest(app)
          .delete(`/api/bookmarks/${bookmarkId}`)
          .set({'Authorization': `Bearer ${process.env.API_TOKEN}`})
          .expect(404, { error: { message: `Bookmark doesn't exist` } });
      });
    });
  });

  describe(`PATCH /api/bookmarks/:bookmark_id`, () => {
    context(`Given no bookmarks`, () => {
      it(`responds with 404`, () => {
        const bookmarkId = 123456;
        return supertest(app)
          .patch(`/api/bookmarks/${bookmarkId}`)
          .set({'Authorization': `Bearer ${process.env.API_TOKEN}`})
          .expect(404, { error: { message: `Bookmark doesn't exist` } });
      });
    });

    context('Given there are bookmarks in the database', () => {
      const testBookmarks = makeBookmarksArray();

      beforeEach('insert Bookmarks', () => {
        return db
          .into('bookmark_data')
          .insert(testBookmarks);
      });

      it('responds with 204 and updates the bookmark', () => {
        const idToUpdate = 2;
        const updateBookmark = {
          url: 'https://www.google.com/',
          rating: 5,
          description: 'World number one search engine from testing'
        };

        const expectedBookmark = {
          ...testBookmarks[idToUpdate - 1],
          ...updateBookmark
        };

        return supertest(app)
          .patch(`/api/bookmarks/${idToUpdate}`)
          .set({'Authorization': `Bearer ${process.env.API_TOKEN}`})
          .send(updateBookmark)
          .expect(204)
          .then(res =>
            supertest(app)
              .get(`/api/bookmarks/${idToUpdate}`)
              .set({'Authorization': `Bearer ${process.env.API_TOKEN}`})
              .expect(expectedBookmark)
          );
      });

      it(`responds with 400 when no required fields supplied`, () => {
        const idToUpdate = 2
        return supertest(app)
          .patch(`/api/bookmarks/${idToUpdate}`)
          .set({'Authorization': `Bearer ${process.env.API_TOKEN}`})
          .send({ irrelevantField: 'foo' })
          .expect(400, {
            error: {
              message: `Request body must contain either 'title', 'url', 'rating' or 'content'`
            }
          })
      });

      it(`responds with 204 when updating only a subset of fields`, () => {
        const idToUpdate = 2
        const updateBookmark = {
          title: 'updated Bookmark title',
        }
        const expectedBookmark = {
          ...testBookmarks[idToUpdate - 1],
          ...updateBookmark
        }

        return supertest(app)
          .patch(`/api/bookmarks/${idToUpdate}`)
          .set({'Authorization': `Bearer ${process.env.API_TOKEN}`})
          .send({
            ...updateBookmark,
            fieldToIgnore: 'should not be in GET response'
          })
          .expect(204)
          .then(res =>
            supertest(app)
              .get(`/api/bookmarks/${idToUpdate}`)
              .set({'Authorization': `Bearer ${process.env.API_TOKEN}`})
              .expect(expectedBookmark)
          )
      });
      

    });
  });
});
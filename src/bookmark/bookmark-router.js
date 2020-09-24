const express = require('express');
const { v4: uuid } = require('uuid');
const bookmarkRouter = express.Router();
const logger = require('../logger');
const bookmarks = require('../store');
const BookmarkService = require('../bookmark-service');
const bodyParser = express.json();

bookmarkRouter
  .route('/')
  .get((req, res, next) => {
    const dbKnex = req.app.get('db');
    BookmarkService.getAllBookmarks(dbKnex)
      .then(bookmarks => {
        res.json(bookmarks);
      })
      .catch(next);
  })
  .post(bodyParser, (req, res) => {
    const { title, url, description, rating } = req.body;

    if (!title) {
      logger.error('Title is required');
      return res
        .status(400)
        .send('Invalid data');
    }

    if (!url) {
      logger.error('url is required');
      return res
        .status(400)
        .send('Invalid data');
    }

    if (!rating) {
      logger.error('rating is required');
      return res
        .status(400)
        .send('Invalid data');
    }

    if (!description) {
      logger.error('description is required');
      return res
        .status(400)
        .send('Invalid data');
    }

    // get an id
    const id = uuid();

    const bookmark = {
      id,
      title,
      url,
      description,
      rating
    };

    bookmarks.push(bookmark);
    logger.info(`Bookmark with id ${id} created`);

    res
      .status(201)
      .location(`http://localhost:8000/anything/${id}`)
      .json(bookmark);
  });

bookmarkRouter
  .route('/:id')
  .get((req, res, next) => {
    const { id } = req.params;
    const dbKnex = req.app.get('db');
    BookmarkService.getById(dbKnex, id).then(bookmark => {
      //console.log('This is the bookie', bookmark);
      if (!bookmark) {
        logger.error(`Bookmark with id ${id} not found.`);
        return res
          .status(404)
          .json({
            error: { message: `Bookmark doesn't exist` }
          });
      }
      res.json(bookmark);
    }).catch(next);
  })
  .delete((req, res) => {
    const { id } = req.params;

    const bookmarkIndex = bookmarks.findIndex(c => c.id == id);

    if (bookmarkIndex === -1) {
      logger.error(`Bookmark with id ${id} not found.`);
      return res
        .status(404)
        .send('Not found');
    }

    bookmarks.splice(bookmarkIndex, 1);

    logger.info(`Bookmark with id ${id} deleted.`);

    res
      .status(204)
      .end();
  });

module.exports = bookmarkRouter;
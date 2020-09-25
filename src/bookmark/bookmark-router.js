const express = require('express');
const path = require('path');
const { v4: uuid } = require('uuid');
const xss = require('xss');
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
  .post(bodyParser, (req, res, next) => {
    const dbKnex = req.app.get('db');
    const { title, url, rating, description } = req.body;

    const newBookmark = { title, url, rating, description };

    for (const [key, value] of Object.entries(newBookmark)) {
      //Check for empty values
      if (value == null) {
        return res.status(400).json({
          error: { message: `Missing '${key}' in request body` }
        });
      }
    }
    if (newBookmark.rating > 5 || newBookmark.rating < 0) {
      return res.status(400).json({
        error: { message: 'Rating should be a number between 1 and 5' }
      });
    }
    if (!newBookmark.url.includes('https://')) {
      return res.status(400).json({
        error: { message: 'Url should include proper https format' }
      });
    }

    const safeBookmark = {
      title: xss(newBookmark.title), // sanitize title
      url: xss(newBookmark.url), // sanitize url
      rating: (newBookmark.rating),
      description: xss(newBookmark.description), // sanitize content
    };
    BookmarkService.insertBookmark(dbKnex, safeBookmark)
      .then(bookmark => {
        res
          .status(201)
          .location(path.posix.join(req.originalUrl, `/${bookmark.id}`))
          .json(bookmark);
      })
      .catch(next);
  });

bookmarkRouter
  .route('/:id')
  .all((req, res, next) => {
    const dbKnex = req.app.get('db');
    BookmarkService.getById(
      dbKnex,
      req.params.id
    )
      .then(bookmark => {
        if (!bookmark) {
          return res.status(404).json({
            error: { message: `Bookmark doesn't exist` }
          });
        }
        res.bookmark = bookmark; // save the article for the next middleware
        next(); // don't forget to call next so the next middleware happens!
      })
      .catch(next);
  })
  .get((req, res, next) => {
    res.json({
      id: res.bookmark.id,
      title: xss(res.bookmark.title), // sanitize title
      url: xss(res.bookmark.url), // sanitize url
      rating: (res.bookmark.rating),
      description: xss(res.bookmark.description), // sanitize content
    });
  })
  .delete((req, res, next) => {
    const dbKnex = req.app.get('db');
    BookmarkService.deleteBookmark(dbKnex, req.params.id)
      .then(() => {
        res.status(204).end();
      })
      .catch(next);
  })
  .patch(bodyParser, (req, res, next) => {
    const { title, url, rating, description } = req.body;
    const bookmarkToUpdate = { title, url, rating, description };
    const dbKnex = req.app.get('db');
    console.log('This is what we get from wrong param', req.params.id);
    if (!req.params.id === '') {
      return res.status(400).json({
        error: {
          message: 'Bookmark ID must be supplied in the url param'
        }
      });
    }

    const numberOfValues = Object.values(bookmarkToUpdate).filter(Boolean).length;
    if (numberOfValues === 0) {
      return res.status(400).json({
        error: {
          message: `Request body must contain either 'title', 'url', 'rating' or 'content'`
        }
      });
    }

    BookmarkService.updateBookmark(
      dbKnex,
      req.params.id,
      bookmarkToUpdate
    )
      .then(numRowsAffected => {
        //console.log('this is what we get back from update bookmark', numRowsAffected);
        res.status(204).end();
      })
      .catch(next);
  });

module.exports = bookmarkRouter;
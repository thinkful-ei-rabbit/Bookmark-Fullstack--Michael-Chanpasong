const BookmarkService = {
  getAllBookmarks(knex) {
    return knex.select('*').from('bookmark_data');
  },
  insertBookmark(knex, newBookmark) {
    return knex
      .insert(newBookmark)
      .into('bookmark_data')
      .returning('*')
      .then(rows => {
        return rows[0];
      });
  },

  getById(knex, id) {
    return knex.from('bookmark_data').select('*').where('id', id).first();
  },

  deleteBookmark(knex, id) {
    return knex('bookmark_data')
      .where({ id })
      .delete();
  },

  updateBookmark(knex, id, newBookmarkFields) {
    return knex('bookmark_data')
      .where({ id })
      .update(newBookmarkFields);
  },
};

module.exports = BookmarkService;
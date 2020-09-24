const BookmarkService = {
  getAllBookmarks(knex) {
    return knex.select('*').from('bookmark_data');
  },
  insertArticle(knex, newBookmark) {
    return knex
      .insert(newArticle)
      .into('blogful_articles')
      .returning('*')
      .then(rows => {
        return rows[0];
      });
  },

  getById(knex, id) {
    return knex.from('bookmark_data').select('*').where('id', id).first();
  },

  deleteArticle(knex, id) {
    return knex('blogful_articles')
      .where({ id })
      .delete();
  },

  updateArticle(knex, id, newArticleFields) {
    return knex('blogful_articles')
      .where({ id })
      .update(newArticleFields);
  },
};

module.exports = BookmarkService;
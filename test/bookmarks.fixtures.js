//title, url, rating, description
//('Google', 'https://www.google.com/', '5', 'Worlds number one search engine')
function makeBookmarksArray() {
  return [
    {
      id: 1,
      title: 'Google',
      url: 'https://www.google.com/',
      rating: 5,
      description: 'World number one search engine'
    },
    {
      id: 2,
      title: 'Thinkful',
      url: 'https://www.thinkful.com/',
      rating: 4,
      description: 'Thinkful Site'
    },
    {
      id: 3,
      title: 'C-Span',
      url: 'https://www.c-span.org/',
      rating: 3,
      description: 'Cspan Site'
    },
    {
      id: 4,
      title: 'Youtube',
      url: 'https://www.youtube.com/',
      rating: 5,
      description: 'Best video watching site'
    },
    {
      id: 5,
      title: 'Facebook',
      url: 'https://www.facebook.com/',
      rating: 1,
      description: 'Worst site ever'
    },
  ];
}

module.exports = {
  makeBookmarksArray,
};
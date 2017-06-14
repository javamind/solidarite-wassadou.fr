/* eslint-env browser */
window.blog = (function () {
  'use strict';

  firebase.initializeApp({
    apiKey: "AIzaSyDNqQdytS7_LSJehhc_ZXu7hxNd4g0br6o",
    authDomain: "solidaritewassadou.firebaseapp.com",
    databaseURL: "https://solidaritewassadou.firebaseio.com",
    storageBucket: "solidaritewassadou.appspot.com"
  });

  let database = firebase.database();
  let nbElementDisplayed = 2;

  /**
   * Converts result to an array
   * @param index
   * @returns {Array}
   * @private
   */
  function _transformResult(index) {
    if (index) {
      return Object.keys(index).map(key => index[key]);
    }
    return [];
  }

  /**
   * Loads the blog file index
   * @param cb
   * @param dirpath
   * @returns {Array}
   * @private
   */
  function _loadBlogIndex(cb) {
    database
      .ref('/blogs')
      .startAt()
      .on('value', (snapshot) => cb(_transformResult(snapshot.val())));
  }

  /**
   * Parse the index, find the potential previous blog and update the view
   * @param blogIndex
   * @param filename
   * @private
   */
  function findPreviousBlogpost(blogIndex, filename) {
    let previous;
    blogIndex
      .sort((a, b) => (a.strdate < b.strdate ? 1 : (a.strdate > b.strdate ? -1 : 0)))
      .forEach((elt, index, array) => {
        if (elt.filename === filename) {
          previous = index < array.length ? array[index + 1] : undefined;
          document.getElementById('blog-keywords').innerHTML = `${_getHtmlKeyword(elt, '-detail')}`;
        }
      });

    if (previous) {
      document.getElementById('previous-blogpost').innerHTML =
        `<div class="swp-blog--previous">Article précédent : <a href="../${previous.dir}/${previous.filename}.html">${previous.doctitle}</a></div>`;
    }

  }

  /**
   * Formats the keywords
   * @param blogpost
   * @param suffix
   * @returns {*}
   */
  function _getHtmlKeyword(blogpost, suffix) {
    return blogpost.keywords
      .split(',')
      .map(keyword => `<span class="swp-blog--keyword${suffix}"><small>${keyword}</small></span>&nbsp;`)
      .reduce((a, b) => a + b);
  }

  function _getArticleList(blogpost) {
    return `
        <tr><td class="swp-blog--shortcutlist"><a title="${blogpost.doctitle}" href="blog/${blogpost.dir}/${blogpost.filename}.html">${blogpost.doctitle}</a></td></tr>
        `;
  }

  function _getArticle(blogpost, first) {
    var article = document.createElement("article");

    article.className = `swp-blog--article${first ? '-head' : ''}`;
    article.innerHTML = `
           <${first ? 'h1' : 'h2'}><a href="blog/${blogpost.dir}/${blogpost.filename}.html">${blogpost.doctitle}</a></${first ? 'h1' : 'h2'}>
           <div class="swp-blog--imgteaser"><img src="${blogpost.imgteaser}"/></div>
           <p class="swp-blog--teaser">${blogpost.teaser}</p>
    `;
    article.onclick = function () {
      document.location.href = `blog/${blogpost.dir}/${blogpost.filename}.html`;
    };

    return article;
  }

  /**
   * Find the last
   * @param blogIndex
   * @private
   */
  function findLastBlogpost(blogIndex) {
    let articles = blogIndex
      .sort((a, b) => (a.strdate < b.strdate ? 1 : (a.strdate > b.strdate ? -1 : 0)))
      .filter((e, index) => index > 0 && index <= nbElementDisplayed)
      .map((blogpost) => _getArticle(blogpost));

    let lastTenArticles = blogIndex
      .sort((a, b) => (a.strdate < b.strdate ? 1 : (a.strdate > b.strdate ? -1 : 0)))
      .filter((e, index) => index < 10)
      .map((blogpost) => _getArticleList(blogpost))
      .reduce((a, b) => a + b);

    let headArticle = document.getElementById('last-article');
    while (headArticle.firstChild) {
      headArticle.removeChild(headArticle.firstChild);
    }
    headArticle.appendChild(_getArticle(blogIndex[0], true));
    articles.forEach(article => headArticle.appendChild(article));

    let otherArticles = document.getElementById('last-articles');
    otherArticles.innerHTML = `
      <table class="swp-blog--tenlastarticles">
        <thead>
            <tr><th>Derniers articles</th></tr>    
        </thead>
        <tbody>
            ${lastTenArticles}
        </tbody>
      </table>
      `;

    if (nbElementDisplayed >= blogIndex.length) {
      document.getElementById('more-article').style.display = 'none';
    }
  }

  function findMoreBlogpost(blogIndex) {
    nbElementDisplayed += 2;
    findLastBlogpost(blogIndex);
  }

  function sendMessage(target, page, title) {
    if ('twitter' === target) {
      document.location.href = `https://twitter.com/intent/tweet?original_referer=${encodeURI(page)}&text=${encodeURI(title) + ' #SolidaritéWassadou'}&tw_p=tweetbutton&url=${encodeURI(page)}`;
    }
    else if ('google+' === target) {
      document.location.href = `https://plus.google.com/share?url=${encodeURI(page)}&text=${encodeURI(title)}`;
    }
    else if ('linkedin' === target) {
      document.location.href = `https://www.linkedin.com/shareArticle?mini=true&url=${encodeURI(page)}&text=${encodeURI(title)}`;
    }
    else if ('facebook' === target) {
      document.location.href = `https://www.facebook.com/sharer/sharer.php?u=${encodeURI(page)}&description=${encodeURI(title)}`;
    }
  }

  return {
    // Find and update the page to display a link to the previous blogpost
    "findPreviousBlogpost": (filename) => _loadBlogIndex((blogIndex) => findPreviousBlogpost(blogIndex, filename)),
    // Display the last written blogpost
    "findLastBlogpost": () => _loadBlogIndex((blogIndex) => findLastBlogpost(blogIndex), 'blog'),
    // Display more Blogsposts
    "findMoreBlogpost": () => _loadBlogIndex((blogIndex) => findMoreBlogpost(blogIndex), 'blog'),
    // Send a message
    "sendSocial": sendMessage
  };
})();


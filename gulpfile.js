'use strict';

const gulp = require('gulp');
const del = require('del');
const path = require('path');
const imagemin = require('gulp-imagemin');
const imageminJpegtran = require('imagemin-jpegtran');
const wbBuild = require('workbox-build');
const website = require('devmind-website')();
const $ = require('gulp-load-plugins')();


const AUTOPREFIXER_BROWSERS = [
  'ie >= 11',
  'ie_mob >= 11',
  'ff >= 45',
  'chrome >= 45',
  'safari >= 7',
  'opera >= 23',
  'ios >= 9',
  'android >= 4.4',
  'bb >= 10'
];

const HTMLMIN_OPTIONS = {
    removeComments: true,
    collapseWhitespace: true,
    collapseBooleanAttributes: true,
    removeAttributeQuotes: false,
    removeRedundantAttributes: true,
    removeEmptyAttributes: true,
    removeScriptTypeAttributes: true,
    removeStyleLinkTypeAttributes: true,
    removeOptionalTags: true,
    minifyCSS: true,
    minifyJS: true,
    jsmin:true
};

const HANDLEBARS_PARTIALS = [
    {key: '_html_header', path: 'src/templates/_html_header.handlebars'},
    {key: '_page_header', path: 'src/templates/_page_header.handlebars'},
    {key: '_page_footer', path: 'src/templates/_page_footer.handlebars'},
    {key: '_html_footer', path: 'src/templates/_html_footer.handlebars'}
];

const CACHE_BUSTING_EXTENSIONS = ['.js', '.css', '.html', '.xml'];

let modeDev = false;

gulp.task('styles', (cb) => {
  gulp.src(['src/sass/main.scss', 'src/sass/blog-list.scss', 'src/sass/blog.scss'])
    .pipe($.newer('build/.tmp/css'))
    .pipe($.sourcemaps.init())
    .pipe($.sass({
      precision: 10
    }).on('error', $.sass.logError))
    .pipe($.autoprefixer(AUTOPREFIXER_BROWSERS))
    .pipe(gulp.dest('build/.tmp/css'))
    // Concatenate and minify styles
    .pipe($.if('*.css', $.cssnano()))
    .pipe($.size({title: 'styles'}))
    .pipe($.if(!modeDev, $.rev()))
    .pipe($.sourcemaps.write('./'))
    .pipe(gulp.dest('build/dist/css'))
    .pipe($.if(!modeDev, $.rev.manifest()))
    .pipe(gulp.dest('build/dist/css'))
    .on('end', () => cb())
});

gulp.task('blog-indexing', () =>
    gulp.src('src/blog/**/*.adoc')
        .pipe(website.readAsciidoc())
        .pipe(website.convertToHtml())
        .pipe(website.convertToJson('blogindex.json'))
        .pipe(gulp.dest('build/.tmp'))
);

gulp.task('blog-rss', () =>
    gulp.src('build/.tmp/blogindex.json')
        .pipe($.wait2(() => website.fileExist('build/.tmp/blogindex.json')))
        .pipe(website.readIndex())
        .pipe(website.convertToRss('blog.xml'))
        .pipe(gulp.dest('build/dist/rss'))
);

gulp.task('blog-index', () =>
  gulp.src('build/.tmp/blogindex.json')
      .pipe($.wait2(() => website.fileExist('build/.tmp/blogindex.json')))
      .pipe(website.readIndex())
      .pipe(website.convertToBlogList('src/templates/index.handlebars', HANDLEBARS_PARTIALS, 'index.html', 1))
      .pipe(gulp.dest('build/.tmp'))
      .pipe($.htmlmin(HTMLMIN_OPTIONS))
      .pipe(gulp.dest('build/dist'))
);

gulp.task('blog-list', () =>
    gulp.src('build/.tmp/blogindex.json')
        .pipe($.wait2(() => website.fileExist('build/.tmp/blogindex.json')))
        .pipe(website.readIndex())
        .pipe(website.convertToBlogList('src/templates/blog_list.handlebars', HANDLEBARS_PARTIALS, 'blog_archive.html', 4))
        .pipe(gulp.dest('build/.tmp'))
        .pipe($.htmlmin(HTMLMIN_OPTIONS))
        .pipe(gulp.dest('build/dist'))
);

gulp.task('blog-archive', () =>
    gulp.src('build/.tmp/blogindex.json')
        .pipe($.wait2(() => website.fileExist('build/.tmp/blogindex.json')))
        .pipe(website.readIndex())
        .pipe(website.convertToBlogList('src/templates/blog_archive.handlebars', HANDLEBARS_PARTIALS, 'blog.html'))
        .pipe(gulp.dest('build/.tmp'))
        .pipe($.htmlmin(HTMLMIN_OPTIONS))
        .pipe(gulp.dest('build/dist'))
);

gulp.task('blog-page', (cb) => {
    gulp.src('src/blog/**/*.adoc')
        .pipe(website.readAsciidoc())
        .pipe(website.convertToHtml())
        .pipe(website.highlightCode({selector: 'pre.highlight code'}))
        .pipe(website.convertToBlogPage('src/templates/blog.handlebars', HANDLEBARS_PARTIALS, 'build/.tmp/blogindex.json'))
        .pipe(gulp.dest('build/.tmp/blog'))
        .pipe($.htmlmin(HTMLMIN_OPTIONS))
        .pipe(gulp.dest('build/dist/blog'))
        .on('end', () => cb())
});

gulp.task('blog', gulp.series('blog-indexing',
                              'blog-page',
                              'blog-list',
                              'blog-rss',
                              'blog-archive',
                              'blog-index'));

gulp.task('lint', () =>
  gulp.src('src/js/**/*.js')
    .pipe($.eslint())
    .pipe($.eslint.format())
);

gulp.task('html-indexing', () =>
    gulp.src(`src/html/**/*.html`)
        .pipe(website.readHtml())
        .pipe(website.convertToJson('pageindex.json'))
        .pipe(gulp.dest('build/.tmp')));

gulp.task('html-template', () =>
    gulp.src(`src/html/**/*.html`)
        .pipe(website.readHtml())
        .pipe(website.applyTemplate(`src/templates/site.handlebars`, HANDLEBARS_PARTIALS))
        .pipe($.size({title: 'html', showFiles: true}))
        .pipe(gulp.dest('build/.tmp'))
        .pipe($.htmlmin(HTMLMIN_OPTIONS))
        .pipe(gulp.dest('build/dist')));

gulp.task('html', gulp.parallel('html-indexing', 'html-template'));

gulp.task('local-js', () =>
    gulp.src(['src/js/*.js'])
        .pipe($.sourcemaps.init())
        .pipe($.babel({
               presets: ['@babel/env']
             }))
        .pipe($.rev())
        .pipe($.sourcemaps.write())
        .pipe($.uglify())
        .pipe($.size({title: 'scripts'}))
        .pipe(gulp.dest('build/dist/js'))
        .pipe($.rev.manifest())
        .pipe(gulp.dest('build/dist/js'))
);

gulp.task('vendor-js', () =>
    gulp.src(['node_modules/fg-loadcss/src/*.js'])
        .pipe($.uglify())
        .pipe(gulp.dest('build/dist/js'))
);

/**
 * Image pre processing is used to minify these assets
 */
gulp.task('images-pre', () =>
    gulp.src('src/images/**/*.{svg,png,jpg}')
        .pipe($.if(!modeDev, imagemin([imagemin.gifsicle(), imageminJpegtran(), imagemin.optipng(), imagemin.svgo()], {
            progressive: true,
            interlaced: true,
            arithmetic: true,
        })))
        .pipe(gulp.dest('build/.tmp/img'))
        .pipe($.if('**/*.{jpg,png}', $.webp()))
        .pipe($.size({title: 'images', showFiles: false}))
        .pipe(gulp.dest('build/.tmp/img'))
);

/**
 * Images generated in image pre processing are renamed with a MD5 (cache busting) and copied
 * in the dist directory
 */
gulp.task('images', () =>
    gulp.src('build/.tmp/img/**/*.{svg,png,jpg,webp}')
    //.pipe(gulp.dest('build/dist/img'))
        .pipe($.rev())
        .pipe(gulp.dest('build/dist/img'))
        .pipe($.rev.manifest())
        .pipe(gulp.dest('build/dist/img'))
);

/**
 * Image post processing is used to copy in dist directory images used without cache busting id
 */
gulp.task('images-post', () =>
    gulp.src('src/images/**/logo*.*')
        .pipe(gulp.dest('build/dist/img'))
);

gulp.task('copy', (cb) => {
    gulp.src([
        'src/*.{ico,html,txt,json,webapp,xml}',
        'src/**/*.pdf',
        'src/.htaccess',
        'node_modules/workbox-sw/build/*-sw.js'
    ], {
        dot: true
    })
        .pipe($.size({title: 'copy', showFiles: true}))
        .pipe(gulp.dest('build/dist'))
        .on('end', () => cb())
});

gulp.task('sitemap', () =>
    gulp.src('build/.tmp/*index.json')
        .pipe(website.readIndex())
        .pipe(website.convertToSitemap())
        .pipe(gulp.dest('build/dist'))
);

gulp.task('service-worker-bundle', () => {
  return wbBuild.injectManifest({
                                  swSrc: 'src/sw.js',
                                  swDest: 'build/.tmp/sw.js',
                                  globDirectory: './build/dist',
                                  globIgnores: ['training/**/*.*'],
                                  globPatterns: ['**/*.{js,css,svg}']
                                  // we don't load image files on SW precaching step
                                })
                .catch((err) => {
                  console.log('[ERROR] This happened: ' + err);
                });
});

gulp.task('service-worker-optim', () =>
  gulp.src(`build/.tmp/sw.js`)
      .pipe($.sourcemaps.init())
      .pipe($.sourcemaps.write())
      .pipe($.uglify())
      .pipe($.size({title: 'scripts'}))
      .pipe($.sourcemaps.write('.'))
      .pipe(gulp.dest(`build/dist`))
);

gulp.task('service-worker', gulp.series('service-worker-bundle', 'service-worker-optim'));

gulp.task('cache-busting-dev', () =>
    gulp.src(['build/dist/**/*.{html,js,css}'])
        .pipe($.revReplace({manifest: gulp.src('build/dist/img/rev-manifest.json'), replaceInExtensions: CACHE_BUSTING_EXTENSIONS}))
        .pipe($.revReplace({manifest: gulp.src('build/dist/css/rev-manifest.json')}))
        .pipe($.revReplace({manifest: gulp.src('build/dist/js/rev-manifest.json')}))
        .pipe(gulp.dest('build/dist'))
);

gulp.task('cache-busting', () =>
    gulp.src(['build/dist/**/*.{html,js,css,xml,json,webapp}'])
        .pipe($.revReplace({manifest: gulp.src('build/dist/img/rev-manifest.json'), replaceInExtensions: CACHE_BUSTING_EXTENSIONS}))
        .pipe($.revReplace({manifest: gulp.src('build/dist/css/rev-manifest.json')}))
        .pipe($.revReplace({manifest: gulp.src('build/dist/js/rev-manifest.json')}))
        .pipe(gulp.dest('build/dist'))
);

gulp.task('compress-svg', (cb) => {
    gulp.src('build/dist/**/*.svg')
        .pipe($.svg2z())
        .pipe(gulp.dest('build/dist'))
        .on('end', () => cb())
});

gulp.task('compress-img', (cb) => {
    gulp.src('build/dist/**/*.{js,css,png,webp,jpg,html}')
        .pipe($.gzip())
        .pipe(gulp.dest('build/dist'))
        .on('end', () => cb())
});

gulp.task('compress', gulp.parallel('compress-svg', 'compress-img'));

gulp.task('watch-html', () =>
  gulp.watch('src/**/*.html', gulp.series('html', 'cache-busting-dev')));
gulp.task('watch-scss', () =>
  gulp.watch('src/**/*.{scss,css}', gulp.series('styles', 'blog',  'html', 'cache-busting-dev')));
gulp.task('watch-adoc', () =>
  gulp.watch('src/**/*.adoc', gulp.series('blog',  'cache-busting-dev')));
gulp.task('watch-js', () =>
  gulp.watch('src/**/*.js', gulp.series('lint', 'local-js', 'blog',  'html', 'cache-busting-dev')));
gulp.task('watch-img', () =>
  gulp.watch('src/images/**/*', gulp.series('images', 'blog',  'html', 'cache-busting-dev')));
gulp.task('watch-template', () =>
  gulp.watch('src/**/*.handlebars', gulp.series('blog',  'html', 'cache-busting-dev')));

gulp.task('watch', gulp.parallel('watch-html', 'watch-scss', 'watch-adoc', 'watch-js', 'watch-img', 'watch-template'));

gulp.task('clean', () => del('build', {dot: true}));

gulp.task('initModeDev', (cb) => {
  modeDev = true;
  cb();
});

gulp.task('build', gulp.series('images-pre',
                               'styles',
                               'blog',
                               'images',
                               'images-post',
                               'lint',
                               'html',
                               'local-js',
                               'vendor-js',
                               'copy',
                               'cache-busting',
                               'service-worker'));


// Build production files, the default task
// Before a delivery we need to launch blog-firebase to update the pages on database
gulp.task('default', gulp.series('clean', 'build', 'sitemap'));

// Build dev files
gulp.task('serve', gulp.series('initModeDev', 'build', 'watch'));


var gulp = require('gulp');
var autoprefixer = require('autoprefixer');
var minifyCSS = require('gulp-minify-css');
var path = require('path');
var sass = require('gulp-sass');
var postcss = require('gulp-postcss');
var config = require('../config');

gulp.task('css', function() {
  var cssDest = path.join(config.STATIC_DIR, 'css');
  var cssSrc = path.join(config.WWW_DIR, 'sass/repfinder.scss');

  var stream =
      gulp.src(cssSrc)
          .pipe(sass({
            includePaths: [
              config.NPM_DIR,
              path.join(config.BOWER_DIR, 'bootstrap-sass/assets/stylesheets')
            ],
          }))
          .pipe(postcss([autoprefixer({browsers: ['> 0.1%']})]));

  if (process.env.NODE_ENV === 'production') {
    stream = stream.pipe(minifyCSS());
  }

  stream = stream.pipe(gulp.dest(cssDest));

  return stream;
});
var gulp = require('gulp');
var path = require('path');
var jshint = require('gulp-jshint');
var uglify = require('gulp-uglify');
var concat = require('gulp-concat');
var stripDebug = require('gulp-strip-debug');

var config = require('../config');

gulp.task('js-lint', function() {
  var jsSrc = path.join(config.WWW_DIR, 'js/**/*.js');

  gulp.src(jsSrc).pipe(jshint()).pipe(jshint.reporter('default'));
});

gulp.task('js', ['js-lint'], function() {
  var jsDest = path.join(config.STATIC_DIR, 'js');
  var jsSrc = path.join(config.WWW_DIR, 'js/**/*.js');

  var stream =
      gulp.src(
              [path.join(config.BOWER_DIR, 'jquery/dist/jquery.min.js'), jsSrc])
          .pipe(concat('repfinder.js'));

  if (process.env.NODE_ENV === 'production') {
    stream = stream.pipe(uglify()).pipe(stripDebug());
  }

  stream = stream.pipe(gulp.dest(jsDest));

  return stream;
});
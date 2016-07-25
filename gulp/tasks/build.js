var gulp = require('gulp');
var runSequence = require('run-sequence');
var path = require('path');
var config = require('../config');

gulp.task('build', function() { runSequence(['img', 'css', 'js']); });

gulp.task('default', ['build'], function() {
  gulp.watch(path.join(config.WWW_DIR, 'sass/repfinder.scss'), function() {
    gulp.run('css');
  });

  gulp.watch(
      path.join(config.WWW_DIR, 'img/**/*'), function() { gulp.run('img'); });

  gulp.watch(
      path.join(config.WWW_DIR, 'js/**/*.js'), function() { gulp.run('js'); });

});
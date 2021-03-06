var path = require('path');

var version = require('../package.json').version;
var buildDir = path.join(__dirname, '../.build');

module.exports = {
  BUILD_DIR: buildDir,
  NPM_DIR: path.join(__dirname, '../node_modules'),
  STATIC_DIR: path.join(buildDir, 'www', version),
  WWW_DIR: path.join(__dirname, '../www'),
  SERVER_DIR: path.join(__dirname, '../server'),
  TEST_DIR: path.join(__dirname, '../test'),
  BOWER_DIR: path.join(__dirname, "../bower_components")
};
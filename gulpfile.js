var argv = process.argv;
var requireDir = require('require-dir');

if (argv[argv.length - 1] === 'test') {
  process.env.NODE_ENV = 'test';
}

requireDir('./gulp/tasks', {recurse: true});
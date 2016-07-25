var express = require('express');
var exphbs = require('express-handlebars');
var bodyParser = require('body-parser');
var morgan = require('morgan');
var path = require('path');
var gconfig = require('./gulp/config');
var config = require('config');
var api = require('./repfinder_handler');
var app = express();

app.disable = ('x-powered-by');

app.engine('.hbs', exphbs({defaultLayout: 'main', extname: '.hbs'}));
app.set('view engine', '.hbs');

app.set('port', config.get('port') || 3000);
app.use(express.static(gconfig.STATIC_DIR));
app.use(bodyParser.json());
app.use(morgan('combined'));

app.get('/', function(req, res) { res.render('body'); });

app.post('/get-details', function(req, res) { api.findRep(req, res); });

app.use(function(req, res) {
  res.type('text/html');
  res.status(404);
  res.render('404');
});

app.use(function(err, req, res, next) {
  console.error(err.stack);
  res.type('text/html');
  res.status(500);
  res.render('500');
});

app.listen(app.get('port'), function() {
  console.log(
      'repfinder has started and is available on port ' + app.get('port') +
      '.');
});
var express = require('express');
// Create web server
var app = express();
app.configure(function(){
  app.set('port', process.env.PORT || 7000);
  app.set('views', __dirname + '/views');
  app.set('view engine', 'ejs');
  app.use(express.favicon());
  //app.use(express.logger('dev'));
  //app.use(bodyParserUpload);
  //app.use(rawBodyParser);
  app.use(express.methodOverride());
  app.use(app.router);
  app.use(require('less-middleware')({ src: __dirname + '/public' }));
  app.use(express.static(path.join(__dirname, 'public')));
});

app.configure('development', function(){
  app.use(express.errorHandler());
});

var postUploadHandler = [bodyParserUpload, uploadCleaner];

app.get('/', routes.index);
app.get('/^\/users', user.list);
app.get('/jobs/submit', function(req, res){
  res.render('job-submit', { title: 'Submit Job' });
});

http.createServer(app).listen(app.get('port'), function(){
  console.log("Express server listening on port " + app.get('port'));
});

var serverName="http://localhost:7000/";
var url = conf.managerBaseUrl + 'api/jobs';
request(url, function (error, response, body) {
  assert.equal(200, response.statusCode);
  done();
});

//use req.connection.remoteAddress to filter request based on IP

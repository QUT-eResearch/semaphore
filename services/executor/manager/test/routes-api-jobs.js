var assert = require('assert');
var request = require('request');
var path = require('path');
var fs = require('fs');

var serverName="http://localhost:3000/";
var url = serverName+'api/1/jobs';

describe(url, function() {
  // List jobs.  
  describe('GET /api/1/jobs', function(){
    it('should return HTTP 200', function(done){
      request(url, function (error, response, body) {
        assert.equal(200, response.statusCode);
        done();
      });
    });
  });
  
  describe('POST /api/1/jobs/daycent', function(){
    // Submit a job
    it('should return HTTP 200', function(done){
      var r = request.post(url+'/type/daycent', function(error, response, body) {
        assert.equal(200, response.statusCode);
        console.log(body);
        done();
      });
      var form = r.form();
      form.append('JsonInput', '{"scheduleName":"kingaroy"}');
      form.append('Username', 'user');
      form.append('Password', 'pass');
      form.append('soils.in', 'http://115.146.95.115/knb/metacat?action=read&docid=sebastian.49.1');
      form.append('InputFiles', fs.createReadStream(path.join(__dirname, 'kingaroy.sch')));
      form.append('InputFiles', fs.createReadStream(path.join(__dirname, 'kingaroy.100')));
      form.append('kingaroy.wth', fs.createReadStream(path.join(__dirname, 'kingaroy.wth')));
    });
  });
});

  
describe('#indexOf()', function(){
  it('should return -1 when the value is not present', function(){
    assert.equal(-1, [1,2,3].indexOf(5));
    assert.equal(-1, [1,2,3].indexOf(0));
  });
});

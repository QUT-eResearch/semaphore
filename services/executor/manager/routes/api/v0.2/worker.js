module.exports = function (rel) {
  rel.get('', function(req, res){
    res.send('worker API ok');
  });

  rel.post('/connect', function(req, res){
    res.send(204);
  });
  
  rel.post('/disconnect', function(req, res){
    res.send(204);
  });

};
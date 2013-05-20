module.exports = function(rel) {

  /** List all jobs */
  rel.get('', function(req, res) {
    res.send('page list all jobs');
  });

  /** Submit form */
  rel.get('/submit/:type', function(req, res) {
    res.render('submit', { title: 'Submit Job', type: req.params.type });
  });

  rel.get('/view/:id', function(req, res) {
    res.send('view job ' +req.params.id);
  });

  rel.get('/edit/:id', function(req, res) {
    res.send('edit job ' +req.params.id);
  });
  
  rel.get('/delete/:id', function(req, res) {
    res.send('delete job ' +req.params.id);
  });
}
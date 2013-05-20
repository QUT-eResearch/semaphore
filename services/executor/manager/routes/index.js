module.exports = function(rel) {
  /*
   * GET home page.
   */
  rel.get('/', function(req, res) {
    res.render('index', { title: 'Express' })
  });

}
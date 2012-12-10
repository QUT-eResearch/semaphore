module.exports = function(rel) {
  rel.get('', function(req, res) {
    res.render('api/index.ejs');
  });
}
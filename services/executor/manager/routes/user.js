/*
 * GET users listing.
 */

exports.list = function(req, res){
  res.send("respond with a resource");
};


module.exports = function(rel) {
  rel.get('/', exports.list);
}

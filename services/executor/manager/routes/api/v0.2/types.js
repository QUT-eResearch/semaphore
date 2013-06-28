module.exports = function (rel) {
  /** List all supported job types */
  rel.get('', function (req, res) {
    res.json(rel.conf.jobTypes);
  });
  
};
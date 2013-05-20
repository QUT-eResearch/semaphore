/// Simple wildcard matching utility
/// Match only * and ?
/// '*.*' only matches string with '.'
module.exports = function Wildcard(pattern) {
  return function (name) {
    var rp = pattern.replace(/(\*|\?|\.)/g, function ($0) {
      var regexChar = {
        '*': '.*',
        '?': '.',
        '.': '\\.'
      };
      return regexChar[$0] ? regexChar[$0] : $0;
    });
    var regex = new RegExp('^'+rp+'$');
    //console.log(regex);
    return regex.test(name);
  };
};

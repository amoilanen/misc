if (!Function.prototype.asMethod) {
  Function.prototype.asMethod = function() {
    var self = this;

    return function(first) {
      var rest = [].slice.call(arguments, 1);

      return self.apply(first, rest);
    }
  };
}

var arr = ["Abc", "ABc", "ABC"];

var lowerCase = arr.map(String.prototype.toLowerCase.asMethod());

console.log(lowerCase);
//["abc", "abc", "abc"]
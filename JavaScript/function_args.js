/*
 * One way to make arguments of a function an array in JavaScript with less boilerplate.
 */

Function.prototype.enhance = Function.prototype.enhance || function() {
  var self = this;

  return function() {
    var oldValue = this._args;

    try {
      this._args = [].slice.call(arguments);
      var result = self.apply(this, this._args);
      return result;
    } finally {
      this._args = oldValue;
    }
  };
};

/*
 * Usage example.
 */
var context = {};
var func1 = function(x, y) {
  console.log('func1');
  console.log('this._args = ', this._args);
  console.log('x = ', x);
  console.log('y = ', y);
}.enhance();
var func2 = function(...x) {
  console.log('func2');
  console.log('this._args = ', this._args);
  console.log('x = ', x);
}.enhance();

context._args = 'global value';
func1.call(context, 'a', 'b', 'c');
console.log('context._args = ', context._args); // _args is not leaked from the function invokation

//Wrong length is reported
//can be fixed by using 'eval' in fixArgs, but not worth it, will only complicate things
console.log('func1.length = ', func1.length);

func2('a', 'b', 'c');
console.log('func2.length = ', func2.length);
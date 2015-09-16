/*
 * Demonstrates how constructor arguments can be expanded if supplied as an array.
 */
function createWithArgs(constructor, args) {
  var boundArgs = [null].concat(args);
  var boundConstructor = Function.prototype.bind.apply(constructor, boundArgs);

  //When 'boundConstructor' is invoked with new,
  //'this' will point to object being constructed, not 'null'
  return new boundConstructor();
}

/*
 * Example of usage.
 */
function Something(a, b, c) {
  console.log('this inside the constructor = ', this); //Something{}
  this.a = a;
  this.b = b;
  this.c = c;
}

var params = [1, 2, 3];
var obj = createWithArgs(Something, params);

console.log(obj); // {a: 1, b: 2, c: 3}
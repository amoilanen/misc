function functionName(func) {
  var match = func.toString().match(/function\s+([^(?:\()\s]*)/);
  return match ? match[1] : "";
}

/*
 * Tests
 */

var func1 = function(x, y) {
  return x + y;
}

function func2(x, y) {
  return x + y;
}

function func3 (x, y) {
  return x + y;
}

[func1, func2, func3].forEach(function(func) {
  console.log("function name = '" + functionName(func) + "'");
  console.log("native function name = '" + func.name + "'");
});
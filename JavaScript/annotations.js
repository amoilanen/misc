/**
 * Example how annotations can be easily added to JavaScript functions, however there is no need in this
 * as unlike in statically typed languages in JavaScript it is already possible to add various fields to functions
 */

(function() {
  if (Function.prototype._annotations) {
    return;
  }

  function parseAnnotation(name, body) {
    return body.split(',').reduce(function(acc, keyValue) {
      keyValue = keyValue.split('=');
      acc[keyValue[0]] = keyValue[1];
      return acc;
    }, {
      name: name
    });
  }

  function parseAnnotations(code) {
    var annotations = [];
    var regex = /\/\/@([a-zA-Z0-9_]+)(?:\((.*)\))?/g;
    var match = regex.exec(code);

    while (match) {
      annotations.push(parseAnnotation(match[1], match[2]));
      match = regex.exec(code);
    }
    return annotations;
  }

  Object.defineProperty(Function.prototype, '_annotations', {
    get: function() {
      return parseAnnotations(this.toString());
    },
    enumerable: true,
    configurable: true
  });
})();

/*
 * Example of usage:
 */

function funcWithAnnotations(x, y) {
  //@Annotation1(key1=value1,key2=value2,key3=value3)
  //@Annotation2(key4=value4)
  //@Annotation3
  return x + y;
}

function funcWithoutAnnotations(x, y) {
  return x - y;
}

console.log('funcWithAnnotations = ', funcWithAnnotations._annotations);
console.log('funcWithoutAnnotations = ', funcWithoutAnnotations._annotations);
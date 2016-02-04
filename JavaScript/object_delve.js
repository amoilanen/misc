/*
 * Adds 'delve' to the Object prototype for accesing nested properties.
 */
if (!Object.prototype.delve) {
  Object.prototype.delve = function(compositeKey) {
    return compositeKey
      .split('.')
      .reduce((obj, key) => obj[key], this);
  }
}

/*
 * Usage example
 */
var obj = {
  a: {
    b: {
      c: 'value'
    }
  }
};

console.log(obj.delve('a.b.c'));
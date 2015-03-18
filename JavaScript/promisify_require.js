/*
 * Enhances 'require' from RequireJS with Promises API while preserving its original semantics.
 */

(function() {

  if (!Promise || !require) {
    return;
  }

  var originalRequire = require;

  function toArray(elems) {
    return [].slice.call(elems);
  }

  req = require = function(deps, callback, errback, optional) {
    return new Promise(function(resolve, reject) {
      originalRequire(deps,
        function() {
          callback && callback.apply(null, toArray(arguments));
          resolve(toArray(arguments));
        },
        function() {
          errback && errback.apply(null, toArray(arguments));
          reject(toArray(arguments));
        },
        optional
      );
    });
  };

  require.config = function() {
    originalRequire.config.apply(originalRequire, toArray(arguments));
  };
})();
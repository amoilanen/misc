(function(host) {

  function generateSets(keys, partialSets) {
    partialSets = partialSets || [[]];
    if (keys.length == 0) {
      return partialSets;
    } else {
      var key = keys.shift();
      var sets = partialSets.concat(partialSets.map(function(set) {
        return set.concat(key);
      }));

      return generateSets(keys, sets);
    }
  }

  var exported = {
    sets: generateSets
  };

  if (module && module.exports) {
    module.exports = exported;
  } else {
    host.Generator = exported;
  }
})(this);
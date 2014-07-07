(function(host) {

  function generateSets(elements, partialSets) {
    partialSets = partialSets || [[]];
    if (elements.length == 0) {
      return partialSets;
    } else {
      var element = elements.shift();
      var sets = partialSets.concat(partialSets.map(function(set) {
        return set.concat(element);
      }));

      return generateSets(elements, sets);
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
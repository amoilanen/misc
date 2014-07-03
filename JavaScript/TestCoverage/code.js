(function(host) {

  var info = {
    "key1": "value1",
    "key2": "value2",
    "key3": "value3"
  };

  function getInfo(keys) {
    return keys.map(function(key) {
      return info[key];
    });
  }

  //Broken implementation
  function getInfoBroken(keys) {
    return ["value1", "value2", "value3"];
  }

  //Expects malformed input
  function getInfoCautious(keys) {
    return keys ? keys.map(function(key) {
      return info[key];
    }).filter(function(key) {
      return key !== undefined;
    }) : [];
  }

  var exported = {
    getInfo: getInfo,
    getInfoBroken: getInfoBroken,
    getInfoCautious: getInfoCautious
  };
  if (module && module.exports) {
    module.exports = exported;
  } else {
    host.Generator = exported;
  }
})(this);
(function(host) {

  var KEY_CODES = {
    ENTER: 13,
    ARROW_UP: 38,
    ARROW_DOWN: 40,
    ESC: 27
  };

  host.Util = {
    KEY_CODES: KEY_CODES,
    hasParent: function(potentialChild, potentialParent) {
      while (potentialChild) {
        if (potentialChild === potentialParent) {
          return true;
        }
        potentialChild = potentialChild.parentNode;
      }
      return false;
    }
  };
})(this);
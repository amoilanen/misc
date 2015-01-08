(function() {

  var prototype = Object.create(HTMLElement.prototype);

  prototype.createdCallback = function() {
    var root = this.createShadowRoot();

    var crumb = document.createElement('div');

    crumb.setAttribute('class', 'crumb');

    root.appendChild(crumb);
  }
  document.registerElement('rc-breadcrumbs', {
    prototype: prototype
  });
})();
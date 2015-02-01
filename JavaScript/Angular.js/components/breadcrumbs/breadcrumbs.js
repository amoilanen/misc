var components = angular.module('Components', []);

components.directive('compBreadcrumbs', function() {
  return {
    restrict: 'E',
    //link: function(scope, element, attrs, controllers) {
      //TODO: Implement
    //  },
    scope: {
      path: '='
    },
    template: '{{path}}'
  };
});
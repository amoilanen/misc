var components = angular.module('Components', []);

components.controller('breadcrumbsController', function ($scope) {
  $scope.pathSelected = function (idx) {
    var newPath = $scope.path.slice(0, idx + 1);
      if (newPath.join('/') != $scope.path.join('/')) {
        $scope.onChange({
          path: newPath
        });
      }
  };
}).directive('compBreadcrumbs', function () {
  return {
    restrict: 'E',
    scope: {
      path: '=',
      onChange: '&onChange'
    },
    controller: 'breadcrumbsController',
    template: '<div class="breadcrumbs">\n' +
'<span class="crumb" ng-click="pathSelected($index)" ng-repeat-start="pathPart in path">{{pathPart}}</span>' +
'<span class="crumb-separator" ng-if="$index < path.length - 1" ng-repeat-end>&gt;</span>' +
'</div>'
  };
});

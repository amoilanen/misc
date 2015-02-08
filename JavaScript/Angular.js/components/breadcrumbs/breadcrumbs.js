var components = angular.module('Components', []);

components.controller('breadcrumbsController', function ($scope) {

  function adaptForRendering(path, maxEntries) {
    maxEntries = maxEntries || -1;
    var hasShortened = false;
    var shortenedPath = [];

    path.forEach(function(pathPart, idx) {

      //Skip path entries in the middle
      if ((maxEntries >= 1) && (idx >= maxEntries - 1) && (idx < path.length - 1)) {

        //Render the dots separator once
        if (!hasShortened) {
          var tooltipParts = path.slice(maxEntries - 1);

          shortenedPath.push({
            value: '...',
            clickable: false,
            tooltip: tooltipParts.join(' > ')
          });
          hasShortened = true;
        }
        return;
      }
      shortenedPath.push({
        value: pathPart,
        clickable: true,
        index: idx
      });
    });
    return shortenedPath;
  }

  $scope.pathSelected = function(idx) {
    if (idx < 0) {
      return;
    }
    var newPath = $scope.path.slice(0, idx + 1);

    if (newPath.join('/') != $scope.path.join('/')) {
      $scope.onChange({
        path: newPath
      });
    }
  };

  $scope.pathToRender = adaptForRendering($scope.path, $scope.maxEntries);
  $scope.$watchCollection('path', function(path) {
    $scope.pathToRender = adaptForRendering(path, $scope.maxEntries);
  });
}).directive('compBreadcrumbs', function () {
  return {
    restrict: 'E',
    scope: {
      path: '=',
      onChange: '&onChange',
      maxEntries: '='
    },
    controller: 'breadcrumbsController',
    templateUrl: 'breadcrumbs.tpl.html'
  };
});
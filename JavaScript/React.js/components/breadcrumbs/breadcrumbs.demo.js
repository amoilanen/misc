var fullPath = ['element1', 'element2', 'element3', 'element4', 'element5', 'element6', 'element7'];

var path = fullPath;

function onPathChange(value) {
}

/*
.controller('Path', function Path($scope, fullPath) {
  $scope.reset = function() {
    $scope.path = fullPath;
  };
  $scope.onPathChange = function(path) {
    $scope.path = path;
  };
  $scope.reset();
});
*/
React.render(
  <div>
    <Breadcrumbs path={path} onChange={onPathChange}/>
    <div id="content">TODO: Display current folder</div>
    <button id="resetButton">Reset</button>
  </div>,
  document.querySelector('#breadcrumbs-container')
);
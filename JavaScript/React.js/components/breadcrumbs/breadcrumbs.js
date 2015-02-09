var Crumb = React.createClass({
  render: function() {
    return (
      <span className="crumb">{this.props.value}</span>
    )
  }
});

var CrumbSeparator = React.createClass({
  render: function() {
    return (
      <span className="crumb-separator">&gt;</span>
    )
  }
});

var Breadcrumbs = React.createClass({
  render: function() {
    var self = this;
    var pathParts = this.props.path;

    var pathCrumbs = pathParts.map(function(pathPart, index) {
      return (
        <Crumb idx={index} value={pathPart} key={index}/>
      );
    });
    var crumbSeparators = pathParts.map(function(pathPart, index) {
      if (index < self.props.path.length - 1) {
        return (
          <CrumbSeparator/>
        )
      }
    });
    var crumbs = _.zip(pathCrumbs, crumbSeparators);

    return (
      <div className="breadcrumbs">
        {crumbs}
      </div>
    );
  }
});
var Crumb = React.createClass({
  activate: function() {
    this.props.onSelected(this.props.idx);
  },
  render: function() {
    return (
      <span className="crumb" onClick={this.activate}>{this.props.value}</span>
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
  onSelected: function(idx) {
    if (idx < 0) {
      return;
    }
    var newPath = this.props.path.slice(0, idx + 1);

    if (newPath.join('/') != this.props.path.join('/')) {
      this.props.onChange(newPath);
    }
  },
  render: function() {
    var self = this;
    var pathParts = this.props.path;

    var pathCrumbs = pathParts.map(function(pathPart, index) {
      return (
        <Crumb idx={index} value={pathPart} key={index} onSelected={self.onSelected}/>
      );
    });
    var crumbSeparators = pathParts.map(function(pathPart, index) {
      if (index < pathParts.length - 1) {
        return (
          <CrumbSeparator/>
        )
      }
    });

    return (
      <div className="breadcrumbs">
        {_.zip(pathCrumbs, crumbSeparators)}
      </div>
    );
  }
});
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

    var crumbs = this.props.path.map(function(pathPart, index) {
      return (
        <span>
          <Crumb idx={index} value={pathPart} key={index}/>
          <CrumbSeparator/>
        </span>
      );
    });

    return (
      <div className="breadcrumbs">
        {crumbs}
      </div>
    );
  }
});
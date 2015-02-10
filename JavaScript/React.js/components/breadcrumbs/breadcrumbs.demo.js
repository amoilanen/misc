var BreadcrumbsDemo = React.createClass({
  getContent: function(path) {
    return path[path.length - 1];
  },
  getInitialState: function() {
    return {
      path: this.props.path
    };
  },
  onPathChange: function(value) {
    this.setState({
      path: value
    });
  },
  reset: function() {
    this.setState({
      path: this.props.path
    });
  },
  render: function() {
    return (
      <div>
        <div id="breadcrumb-container">
          <Breadcrumbs path={this.state.path} maxEntries="5" onChange={this.onPathChange}/>
        </div>
        <div id="content">{this.getContent(this.state.path)}</div>
        <button id="resetButton" onClick={this.reset}>Reset</button>
      </div>
    )
  }
});

var fullPath = ['element1', 'element2', 'element3', 'element4', 'element5', 'element6', 'element7'];

React.render(
  <BreadcrumbsDemo path={fullPath}/>,
  document.querySelector('#container')
);
var Crumb = React.createClass({
  activate: function() {
    this.props.onSelected(this.props.idx);
  },
  onKeyPress: function(event) {
    if (event.nativeEvent.which == 13) {
      this.activate();
    }
  },
  render: function() {
    return (
      <span className="crumb" tabIndex="0" onKeyPress={this.onKeyPress} onClick={this.activate}>{this.props.value}</span>
    )
  }
});

var CrumbSeparator = React.createClass({
  render: function() {
    return (
      <span className="crumb-separator" title={this.props.tooltip}>{this.props.value}</span>
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
    var path = this.props.path;
    var maxEntries = this.props.maxEntries || -1;
    var hasShortened = false;
    var crumbs = [];

    path.forEach(function(pathPart, idx) {

      //Skip path entries in the middle
      if ((maxEntries >= 1) && (idx >= maxEntries - 1) && (idx < path.length - 1)) {

        //Render the dots separator once
        if (!hasShortened) {
          var tooltipParts = path.slice(maxEntries - 1);

          tooltipParts.pop();
          crumbs.push(
            <CrumbSeparator value="..." key={idx} tooltip={tooltipParts.join(' > ')}/>,
            <CrumbSeparator value="&gt;" key={path.length + idx}/>
          );
          hasShortened = true;
        }
        return;
      }
      crumbs.push(
        <Crumb idx={idx} value={pathPart} key={idx} onSelected={self.onSelected}/>
      );
      if (idx != path.length - 1) {
        crumbs.push(
          <CrumbSeparator value="&gt;" key={path.length + idx}/>
        );
      }
    });

    return (
      <div className="breadcrumbs">
        {crumbs}
      </div>
    );
  }
});
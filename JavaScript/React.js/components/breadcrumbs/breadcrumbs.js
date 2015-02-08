//TODO: Port the Breadcrumbs component to React.js
var Breadcrumbs = React.createClass({
  render: function() {
    return (
      <div>{this.props.path.join('>')}</div>
    );
  }
});
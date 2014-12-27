var SelectOption = React.createClass({
  render: function() {
    return (
      <li value={this.props.value}>{this.props.label}</li>
    );
  }
});

var SelectOptionList = React.createClass({
  render: function() {
    var options = this.props.options.map(function(option, index) {
      return (
        <SelectOption label={option.label} value={option.value} key={index} />
      );
    });

    return (
      <div className={this.props.active ? "rc-select--options fade-in-fast" : "rc-select--options"}>
        <ul>
          {options}
        </ul>
      </div>
    );
  }
});

var Select = React.createClass({
  getInitialState: function() {
    return {
      active: false
    };
  },
  toggle: function() {
    this.setState({active: !this.state.active});
  },
  render: function() {
    return (
      <div onClick={this.toggle} className={this.state.active ? "rc-select rc-select_active" : "rc-select"}>
        <div className="rc-select--field">
          <div className="rc-select--input">abcdef</div>
          <div className="rc-select--arrow"></div>
        </div>
        <SelectOptionList options={this.props.options} active={this.state.active}/>
      </div>
    );
  }
});
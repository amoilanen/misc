var SelectOption = React.createClass({
  render: function() {
    return (
      <li>{this.props.label}</li>
    );
  }
});

var SelectOptionList = React.createClass({
  render: function() {
    var options = this.props.options.map(function(option, index) {
      return (
        <SelectOption label={option.label} key={index} />
      );
    });

    return (
      <div className="rc-select--options">
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
      options: [
        {
          label: "Prague"
        },
        {
          label: "Berlin"
        },
        {
          label: "Helsinki"
        },
        {
          label: "Amsterdam"
        },
        {
          label: "Paris"
        }
      ]
    };
  },
  render: function() {
    return (
      <div className="rc-select">
        <div className="rc-select--field">
          <div className="rc-select--input">abcdef</div>
          <div className="rc-select--arrow"></div>
        </div>
        <SelectOptionList options={this.state.options} />
      </div>
    );
  }
});
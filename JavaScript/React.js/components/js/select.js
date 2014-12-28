var SelectOption = React.createClass({
  select: function() {
    this.props.onSelect(this.props.value);
  },
  render: function() {
    var className = this.props.selected ? "rc-select--option rc-select--option_selected" : "rc-select--option";

    return (
      <li value={this.props.value} className={className} onClick={this.select}>
        <div className="rs-selection--option-label">{this.props.label}</div>
      </li>
    );
  }
});

var SelectOptionList = React.createClass({
  render: function() {
    var self = this;
    var options = this.props.options.map(function(option, index) {
      return (
        <SelectOption label={option.label} value={option.value} selected={option.selected} key={index} onSelect={self.props.onSelect}/>
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
  toggle: function(active) {
    if (typeof active === 'undefined') {
      active = !this.state.active;
    }
    var focusTrapElement = this.refs.rcSelectFocusTrap.getDOMNode();

    this.setState({active: active});
    if (active) {
      focusTrapElement.focus();
    } else {
      focusTrapElement.blur();
    }
  },
  onClick: function(event) {
    this.toggle();
  },
  onKeyUp: function(event) {
    var nativeEvent = event.nativeEvent;

    if (nativeEvent.keyCode === 27) {
      this.toggle(false);
    }
  },
  select: function(value) {
    this.props.options.forEach(function(option) {
      option.selected = (option.value === value);
    });
  },
  render: function() {
    var selectedOption = this.props.options.filter(function(option) {
      return option.selected;
    })[0];

    return (
      <div onClick={this.onClick} className={this.state.active ? "rc-select rc-select_active" : "rc-select"}>
        <input onKeyUp={this.onKeyUp} className="rc-select--focus-trap" ref="rcSelectFocusTrap" type="text" readOnly="true" />
        <div className="rc-select--field">
          <div className="rc-select--input">{selectedOption.label}</div>
          <div className="rc-select--arrow"></div>
        </div>
        <SelectOptionList options={this.props.options} active={this.state.active} onSelect={this.select}/>
      </div>
    );
  }
});
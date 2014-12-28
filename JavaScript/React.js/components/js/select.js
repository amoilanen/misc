var SelectOption = React.createClass({
  onSelect: function(event) {
    this.props.onSelect(this.props.value);
    event.stopPropagation();
  },
  render: function() {
    var className = this.props.selected ? "rc-select--option rc-select--option_selected" : "rc-select--option";

    return (
      <li value={this.props.value} className={className} onClick={this.onSelect}>
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
  onBlur: function(event) {
    var self = this;

    /*
     * Blur can occur if we click on an option or outside of the option list,
     * giving some time for option selection to complete.
     */
    setTimeout(function() {
      if (self.state.active) {
        self.toggle(false);
      }
    }, 200);
  },
  select: function(value) {
    this.props.options.forEach(function(option) {
      option.selected = (option.value === value);
    });
    this.toggle();
  },
  render: function() {
    var selectedOption = this.props.options.filter(function(option) {
      return option.selected;
    })[0];

    return (
      <div onClick={this.onClick} className={this.state.active ? "rc-select rc-select_active" : "rc-select"}>
        <input onKeyUp={this.onKeyUp} onBlur={this.onBlur} className="rc-select--focus-trap" ref="rcSelectFocusTrap" type="text" readOnly="true" />
        <div className="rc-select--field">
          <div className="rc-select--input">{selectedOption.label}</div>
          <div className="rc-select--arrow"></div>
        </div>
        <SelectOptionList options={this.props.options} active={this.state.active} onSelect={this.select}/>
      </div>
    );
  }
});
var SelectOption = React.createClass({
  onSelect: function(event) {
    this.props.onSelect(this.props.value);
    event.stopPropagation();
  },
  render: function() {
    var className = "rc-select--option";

    if (this.props.selected) {
      className = className + " rc-select--option_selected";
    }
    if (this.props.active) {
      className = className + " rc-select--option_active";
    }
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
        <SelectOption active={index === self.props.activeIndex} label={option.label} value={option.value} selected={option.selected} key={index} onSelect={self.props.onSelect}/>
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
  componentDidMount: function() {
    window.addEventListener('click', this.onDocumentClick);
  },
  getInitialState: function() {
    return {
      active: false,
      activeIndex: 3
    };
  },
  toggle: function(active) {
    if (typeof active === 'undefined') {
      active = !this.state.active;
    }
    var focusTrapElement = this.refs.rcSelectFocusTrap.getDOMNode();

    this.setState({
      active: active,
      activeIndex: 3
    });
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
    var activeIndex = this.state.activeIndex;

    if (nativeEvent.keyCode === 27) {
      this.toggle(false);
    } else if (nativeEvent.keyCode === 40) {
      activeIndex++;
      if (activeIndex >= this.props.options.length) {
        activeIndex = 0;
      }
      this.setState({activeIndex: activeIndex});
    } else if (nativeEvent.keyCode === 38) {
      activeIndex--;
      if (activeIndex < 0) {
        activeIndex = this.props.options.length - 1;
      }
      this.setState({activeIndex: activeIndex});
    }
  },
  isInsideComponent: function(domElement) {
    var containerElement = this.refs.rcSelectContainer.getDOMNode();

    while (domElement) {
      if (domElement === containerElement) {
        return true;
      }
      domElement = domElement.parentNode;
    }
    return false;
  },
  onDocumentClick: function(event) {
    if (this.state.active && !this.isInsideComponent(event.target)) {
      this.toggle(false);
    }
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
      <div ref="rcSelectContainer" onClick={this.onClick} className={this.state.active ? "rc-select rc-select_active" : "rc-select"}>
        <input ref="rcSelectFocusTrap" onKeyUp={this.onKeyUp} className="rc-select--focus-trap" type="text" readOnly="true" />
        <div className="rc-select--field">
          <div className="rc-select--input">{selectedOption.label}</div>
          <div className="rc-select--arrow"></div>
        </div>
        <SelectOptionList activeIndex={this.state.activeIndex} options={this.props.options} active={this.state.active} onSelect={this.select}/>
      </div>
    );
  }
});
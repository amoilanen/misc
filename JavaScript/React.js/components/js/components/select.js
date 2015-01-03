define('components/select-option', function() {

  var SelectOption = React.createClass({
    onSelect: function(event) {
      this.props.onSelect(this.props.value);
      event.stopPropagation();
    },
    onMouseOver: function(event) {
      this.props.onActivate(this.props.idx);
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
        <li value={this.props.value} className={className} onMouseOver={this.onMouseOver} onClick={this.onSelect}>
          <div className="rs-selection--option-label">{this.props.label}</div>
        </li>
      );
    }
  });
  return SelectOption;
});

define('components/select-option-list', ['components/select-option'], function(SelectOption) {

  var SelectOptionList = React.createClass({

    render: function() {
      var self = this;
      var options = this.props.options.map(function(option, index) {
        return (
          <SelectOption active={index === self.props.activeIndex} idx={index} label={option.label} value={option.value} selected={option.selected} key={index} onSelect={self.props.onSelect} onActivate={self.props.onActivate}/>
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
  return SelectOptionList;
});

define('components/select', ['components/select-option-list', 'components/util'], function(SelectOptionList, Util) {

  var Select = React.createClass({
    componentDidMount: function() {
      window.addEventListener('click', this.onDocumentClick);
    },
    getInitialState: function() {
      return {
        active: false,
        inFocus: false,
        activeIndex: -1
      };
    },
    toggle: function(active) {
      if (typeof active === 'undefined') {
        active = !this.state.active;
      }
      var focusTrapElement = this.refs.rcSelectFocusTrap.getDOMNode();

      this.setState({
        active: active,
        activeIndex: -1
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

      switch(nativeEvent.keyCode) {

        case Util.KEY_CODES.ESC:
          this.toggle(false);
          break;

        case Util.KEY_CODES.ARROW_DOWN:
          if (!this.state.active) {
            this.toggle(true);
          }
          activeIndex++;
          if (activeIndex >= this.props.options.length) {
            activeIndex = 0;
          }
          this.setState({activeIndex: activeIndex});
          break;

        case Util.KEY_CODES.ARROW_UP:
          if (!this.state.active) {
            this.toggle(true);
          }
          activeIndex--;
          if (activeIndex < 0) {
            activeIndex = this.props.options.length - 1;
          }
          this.setState({activeIndex: activeIndex});
          break;

        case Util.KEY_CODES.ENTER:
          var activeOption = this.props.options[this.state.activeIndex];

          this.setState({activeIndex: -1});
          this.select(activeOption.value);
          break;

        default:
          break;
      }
    },
    onFocus: function(event) {
      this.setState({inFocus: true});
    },
    onBlur: function(event) {
      this.setState({inFocus: false});
    },
    onDocumentClick: function(event) {
      var selectContainerElement = this.refs.rcSelectContainer.getDOMNode();

      if (this.state.active && !Util.hasParent(event.target, selectContainerElement)) {
        this.toggle(false);
      }
    },
    select: function(value) {
      var self = this;
      var focusTrapElement = this.refs.rcSelectFocusTrap.getDOMNode();

      this.props.options.forEach(function(option) {
        option.selected = (option.value === value);

        if (option.selected) {
          self.props.onSelect(option);
        }
      });
      this.toggle();

      //Need to return focus to the focus trap, the focus was lost to an option
      focusTrapElement.focus();
    },
    activate: function(idx) {
      this.setState({activeIndex: idx});
    },
    render: function() {
      var selectedOption = this.props.options.filter(function(option) {
        return option.selected;
      })[0];
      var className = "rc-select";

      if (this.state.active) {
        className = className + " rc-select_active";
      }
      if (this.state.inFocus) {
        className = className + " rc-select_focus";
      }
      return (
        <div ref="rcSelectContainer" onClick={this.onClick} className={className}>
          <input ref="rcSelectFocusTrap" onKeyUp={this.onKeyUp} className="rc-select--focus-trap" type="text" readOnly="true" onFocus={this.onFocus} onBlur={this.onBlur} />
          <div className="rc-select--field">
            <div className="rc-select--input">{selectedOption.label}</div>
            <div className="rc-select--arrow"></div>
          </div>
          <SelectOptionList activeIndex={this.state.activeIndex} options={this.props.options} active={this.state.active} onSelect={this.select} onActivate={this.activate}/>
        </div>
      );
    }
  });
  return Select;
});
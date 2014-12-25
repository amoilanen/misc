var Select = React.createClass({
  render: function() {
    return (
      <div className="rc-select">
        <div className="rc-select--field">
          <div className="rc-select--input">abcdef</div>
          <div className="rc-select--arrow"></div>
        </div>
        <div className="rc-select--options">
          <ul>
            <li>Prague</li>
            <li>Berlin</li>
            <li>Helsinki</li>
            <li>Amsterdam</li>
            <li>Paris</li>
          </ul>
        </div>
      </div>
    );
  }
});

var options = [
  {
    value: 75,
    label: "Prague"
  },
  {
    value: 86,
    label: "Berlin",
    selected: true
  },
  {
    value: 33,
    label: "Helsinki"
  },
  {
    value: 26,
    label: "Amsterdam"
  },
  {
    value: 77,
    label: "Paris"
  },
  {
    value: 35,
    label: "Munchen"
  }
];

function onChange(callbackSelectedOption) {

  //Selected option is passed to the callback
  console.log("Select option, passed to callback = ", callbackSelectedOption);

  //Options passed to the component are also updated
  var selectedOption = options.filter(function(option) {
    return option.selected;
  })[0];

  console.log("Select option, from the initial list = ", selectedOption);
}

require(['components/select'], function(Select) {
  console.log('Select = ', Select);
  React.render(
    <Select options={options} onChange={onChange}/>,
    document.getElementById('select-example')
  );
});
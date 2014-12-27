var options = [
  {
    value: 75,
    label: "Prague"
  },
  {
    value: 86,
    label: "Berlin"
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
    value: 75,
    label: "Paris"
  },
  {
    value: 35,
    label: "Munchen"
  }
];

React.render(
  <Select options={options}/>,
  document.getElementById('select-example')
);
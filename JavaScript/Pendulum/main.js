function init() {
  var parameters = new Parameters();
  var display = new Display("#display", 350, 350);
  var physicalWorld = new PhysicalWorld();
  var simulation = new Simulation(physicalWorld, display, parameters);

  parameters.bind({
    'alpha': '- 2pi/3',
    'beta': '0.003'
  }, function() {
    simulation.run();
  });
  display.init();
  simulation.run();
}

window.addEventListener("load", init);
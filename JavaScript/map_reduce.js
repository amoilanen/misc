/*
 * Simplistic map-reduce like API in JavaScript.
 *
 * No support for scalability or distributed computations, just an illustration of the computational model.
 */
(function(host) {

  function MapReduce(inputs, mapper, reducer) {
    this.inputs = inputs;
    this.mapper = mapper;
    this.reducer = reducer;
  }

  MapReduce.prototype.emit = function(key, value) {
    this.intermediate.push([key, value]);
  }

  MapReduce.prototype.compute = function() {
    var self = this;

    this.intermediate = [];

    //Applying the mapper
    this.inputs.forEach(function(input) {
      self.mapper.call(self, input);
    });

    //Grouping emitted pairs by key
    var grouped = this.intermediate.reduce(function(acc, pair) {
      var key = pair[0];
      var value = pair[1];

      acc[key] = acc[key] || [];
      acc[key].push(value);
      return acc;
    }, {});

    //Applying the reducer
    return Object.keys(grouped).reduce(function(acc, key) {
      var pair = [key, grouped[key]];
      var reduced = self.reducer.apply(self, pair);

      acc.push(reduced);
      return acc;
    }, []);
  };

  host.MapReduce = MapReduce;
})(this);

/*
 * Word frequencies.
 */
function sum(values) {
  return values.reduce(function(x, y) {
    return x + y;
  }, 0);
}

var words = "a b b c a c b d a b b b a".split(" ");

var wordFrequencies = new MapReduce(words,
  function mapper(word) {
    this.emit(word, 1);
  },
  function reducer(key, values) {
    return [key, sum(values)];
  }
).compute();

console.log("frequencies = ", wordFrequencies);
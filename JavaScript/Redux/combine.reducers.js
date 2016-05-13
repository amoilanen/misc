/*
 * Demonstrates how 'combineReducers' can be implemented.
 */
function combineReducers(reducers) {
  return function(state, action) {
    var reducerNames = Object.keys(reducers);
    var combination = {};

    reducerNames.forEach(function(reducerName) {
      combination[reducerName] = reducers[reducerName](state[reducerName], action);
    });

    return combination;
  };
}

/*
 * Client code
 */
var state = {
  key1: {
    subkey1: 'value1'
  },
  key2: 'value2'
};
var action = 'testAction';

function func1(state, action) {
  return state.subkey1 + '_reduced';
}

function key2(state, action) {
  return state + '_reduced';
}

var reducer = combineReducers({
  key1: func1, key2
});

console.log(reducer(state, action));
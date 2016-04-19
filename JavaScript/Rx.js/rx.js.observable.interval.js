Rx.Observable.interval = function(timeout) {
  var DEFAULT_TIMEOUT_MS = 1000;
  timeout = timeout || DEFAULT_TIMEOUT_MS;

  return Rx.Observable.create(function(observer) {
    var i = 0;
    var interval = setInterval(function() {
      observer.onNext(i++);
    }, timeout);

    return function() {
      clearInterval(interval);
      observer.onCompleted();
    };
  });
};

/*
 * Usage example
 */
var subscription = Rx.Observable.interval(100).subscribe(
  function onNext(x) {
    console.log('Next value = ', x);
  },
  function onError() {},
  function onCompleted() {
    console.log('Completed');
  }
);

setTimeout(function() {
  subscription.dispose();
}, 1000);
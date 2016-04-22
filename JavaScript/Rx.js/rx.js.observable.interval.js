Rx.Observable.interval = function(timeout) {
  var DEFAULT_TIMEOUT_MS = 1000;
  timeout = timeout || DEFAULT_TIMEOUT_MS;

  return Rx.Observable.create(function(observer) {
    var i = 0;
    var interval = setInterval(function() {
      observer.onNext(i++);
    }, timeout);
  });
};

function onNext(x) {
  console.log('Next value = ', x);
}

function onCompleted() {
  console.log('Completed');
}

/*
 * Usage example
 */
var interval = Rx.Observable.interval(100);
var subscription = interval.subscribe(onNext, null, onCompleted);

setTimeout(function() {
  subscription.dispose();
  console.log('Disposed of old subscription');
  setTimeout(function() {
    subscription = interval.subscribe(onNext, null, onCompleted);
    console.log('Created new subscription');
    setTimeout(function() {
      subscription.dispose();
      console.log('Now all subscriptions are cancelled');
    }, 500);
  }, 500);
}, 500);

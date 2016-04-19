Rx.Observable.merge = function() {
  var observables = [].slice.call(arguments);

  return Rx.Observable.create(function(observer) {
    var completedCount = 0;

    function unsubscribe() {
      subscriptions && subscriptions.forEach(function(subscription) {
        subscription.dispose();
      });
    }

    var subscriptions = observables.map(function(observable) {
      return observable.subscribe(
        function onNext(x) {
          observer.onNext(x);
        },
        function onError(e) {
          observer.onError(e);
        },
        function onCompleted() {
          completedCount++;
          if (completedCount === observables.length) {
            unsubscribe();
            observer.onCompleted();
          }
        }
      );
    });

    return function() {
      unsubscribe();
      observer.onCompleted();
    };
  });
};

/*
 * Usage example
 */
var subscription = Rx.Observable.merge(
  Rx.Observable.create(function(observer) {
    setTimeout
    observer.onNext(1);
    observer.onNext(2);
    observer.onNext(3);
    observer.onCompleted();
  }),
  Rx.Observable.create(function(observer) {
    observer.onNext(4);
    observer.onNext(5);
    observer.onNext(6);
    observer.onCompleted();
  }),
  Rx.Observable.create(function(observer) {
    observer.onNext(7);
    observer.onNext(8);
    observer.onNext(9);
    observer.onCompleted();
  })
).subscribe(
  function onNext(x) {
    console.log('Next value = ', x);
  },
  function onError() {},
  function onCompleted() {
    console.log('Completed');
  }
);
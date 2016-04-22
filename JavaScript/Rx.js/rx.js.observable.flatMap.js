function range(start, end) {
  return Rx.Observable.create(function(observer) {
    for (var i = start; i <= end; i++) {
      observer.onNext(i);
    }
    observer.onCompleted();
  });
}

function fromValues() {
  var values = [].slice.call(arguments);

  return Rx.Observable.create(function(observer) {
    for (var i = 0; i < values.length; i++) {
      observer.onNext(values[i]);
    }
    observer.onCompleted();
  });
};

function flatMap(observable) {
  return Rx.Observable.create(function(observer) {
    var childSubscriptions = [];

    var mainSubscription = observable.subscribe(
      function onNext(x) {
        var childSubscription = x.subscribe(
          function onNext(childX) {
            observer.onNext(childX)
          },
          function onError(childError) {
            observer.onError(childError);
          },
          function onCompleted() {
            if (childSubscription) {
              childSubscription.dispose();
              childSubscriptions.splice(childSubscriptions.indexOf(childSubscription), 1);
            }
          }
        );
        childSubscriptions.push(childSubscription);
      },
      function onError(error) {
        observer.onError(error);
      },
      function onCompleted() {
        var checkInterval = setInterval(function() {
          if (childSubscriptions.length === 0) {
            clearInterval(checkInterval);
            observer.onCompleted();
          }
        }, 100);
      }
    );
  });
};

function onNext(x) {
  console.log('value = ', x);
}

function onCompleted() {
  console.log('Completed!');
}

flatMap(
  fromValues(
    range(1, 5),
    range(6, 10),
    range(11, 15)
  )
).subscribe(onNext, null, onCompleted);
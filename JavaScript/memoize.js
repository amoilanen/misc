//2012 Anton Ivanov anton.al.ivanov@gmail.com
//JavaScript memoization http://en.wikipedia.org/wiki/Memoization

(function (host) {
    function memoize(func, host, hash) {
        //By default memoize a function on the window object
        var host = host || window,
            hash = hash || {},
            original = host[func];
        //Only functions can be memoized
        if (!host[func] || !(host[func] instanceof Function)) {
            throw "Can memoize only a function";
        };
        //Redefine the function on the host object
        host[func] = function() {
            //The key in the cash is a JSON representation of arguments
            var jsonArguments = JSON.stringify(arguments);
            //If the value has not yet been computed
            if (!hash[jsonArguments]) {
                //Calling the original function with the arguments provided to host[func],
                //'this' in the original function will also be the same as in the redefined function in order to handle
                //host[func].call and host[func].apply
                hash[jsonArguments] = original.apply(this, Array.prototype.slice.call(arguments, 0));
            };
            return hash[jsonArguments];
        };
    };
    //Exporting the 'memoize' function
    if (!host.memoize) {
        host.memoize = memoize;
    };
})(window);

////Usage example
//function fib(num) {
//    return (num < 2) ? num : fib(num - 1) + fib(num - 2);
//};
//
//memoize("fib");
//
//console.log("fib(10) = ", fib(10));
//console.log("fib(10) = ", fib(10));
//console.log("fib(11) = ", fib(11));
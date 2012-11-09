var lib = {
    R: {}
};

(function(host) {
    function conj(element, arr, index) {
        var arrCopy = arr.slice(index || 0);

        arrCopy.unshift(element);
        return arrCopy;
    };

    function recurWithOpts(opts) {
        var params = Array.prototype.slice.call(arguments).slice(1);
        var current = opts.initial;

        while (opts.cont.apply(null, params)) {
            current = opts.body.apply(null, conj(current, params));
        
            var nextParams = opts.next.apply(null, params);
            params = (nextParams instanceof Array) ? nextParams : [nextParams];
        };
        return current;
    };

    function createOpts(args, cont, next, body, initial) {
        var generated = "var x = {};\
        x.cont = function(" + args + ") {\
              " + cont + "\
        };\
        x.initial = " + initial + ";\
        x.next = function(" + args + ") {\
              " + next + "\
        };\
        x.body = function(current, " + args + ") {\
              " + body + "\
        };\
        x";
        return eval(generated);
    };

    function recur(args, cont, next, body, initial) {
        return recurWithOpts.apply(null,
            conj(createOpts(args, cont, next, body, initial),
                 Array.prototype.slice.call(arguments), 5));
    };

    host.recur = recur;
})(lib.R);

//################################################
//Example of usage:
//################################################

//Recursive functions with tail recursion
function factorial(n) {
    return (n > 1) 
        ? n * factorial(n - 1)
        : 1;
};

function path_to_zero_in_3D_from(x, y, z) {    
    if (0 == Math.floor(Math.abs(x)) && 0 == Math.floor(Math.abs(y)) && 0 == Math.floor(Math.abs(z))) {
        return [{x: 0, y: 0, z: 0}];
    } else {
        var pathPart = path_to_zero_in_3D_from(x/2, y/2, z/2);

        pathPart.unshift({x: x, y: y, z: z})
        return pathPart;
    }
};

//Tail recursion optimized
function factorial_opt(n) {
    return lib.R.recur("n",
        "return n > 1;",
        "return n - 1;", 
        "return n * current;",
        1,
        n);
};

function path_to_zero_in_3D_from_opt(x, y, z) {
    var path = lib.R.recur("x, y, z",
        "return 0 != Math.floor(Math.abs(x)) || 0 != Math.floor(Math.abs(y)) || 0 != Math.floor(Math.abs(z));",
        "return [x/2, y/2, z/2];",
        "current.push({x: x, y: y, z: z});\
        return current;",
        "[]",
        x, y, z);
    path.push({x: 0, y: 0, z: 0});
    return path;
};

//Tests
function check(testName, expectedValue) {
    var actualValues = Array.prototype.slice.call(arguments).slice(2);
    
    actualValues.forEach(function (actualValue) {
        if (expectedValue != actualValue) {
            throw new Error(testName + ": expected " + expectedValue + " but was " + actualValue);
        }
    });
    console.log(testName + " - OK: " + expectedValue);
};

check("factorial of 0", 1, factorial(0), factorial_opt(0));
check("factorial of 1", 1, factorial(1), factorial_opt(1));
check("factorial of 5", 120, factorial(5), factorial_opt(5));

var path = path_to_zero_in_3D_from(4, 4, 4);
path.name = "path";
var path_opt = path_to_zero_in_3D_from_opt(4, 4, 4);
path_opt.name = "path_opt";

["x", "y", "z"].forEach(function (axis) {
    [path, path_opt].forEach(function (path) {
        check(path.name + " " + axis + " axis. Path from (4, 4, 4)", "4,2,1,0", path.map(function (point) {
            return point[axis];
        }).toString());
    });
});
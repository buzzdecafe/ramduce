var symbolExists = typeof Symbol !== 'undefined',
    symTransformer = symbolExists ? Symbol('transformer') : '@@transformer';

var _isArray = Array.isArray || function _isArray(val) {
    return (val != null &&
            val.length >= 0 &&
            Object.prototype.toString.call(val) === '[object Array]');
};


function _hasMethod(methodName, obj) {
    return obj != null && !_isArray(obj) && typeof obj[methodName] === 'function';
}

function _isFunction(obj){
  return typeof obj === 'function';
}

function _curry2(fn) {
    return function(a, b) {
        switch (arguments.length) {
            case 0:
                throw new TypeError('function called without arguments');
            case 1:
                return function(b) {
                    return fn(a, b);
                };
            default:
                return fn(a, b);
        }
    };
}

var mapping = function mapping(fn) {
    return function(step) {
        return function mapduce(acc, x) {
            return step(acc, fn(x));
        };
    };
};

var filtering = function filtering(fn) {
    return function(step) {
        return function filterduce(acc, x) {
            return fn(x) ? step(acc, fn(x)) : acc;
        };
    };
};


var map = _curry2(function _map(fn, list) {
    // Functor case
    if (_hasMethod('map', list)) {
        return list.map(fn);
    }
    // Transducer case
    if (_isFunction(list)) {
        return mapping(fn);
    }
    // Array case (yes, I know it's a functor...)
    var idx = -1, len = list.length, result = new Array(len);
    while (++idx < len) {
        result[idx] = fn(list[idx]);
    }
    return result;
});

var filter = _curry2(function _filter(pred, list) {
    // Functor case
    if (_hasMethod('map', list)) {
        return list.map(pred);
    }
    // Transducer case
    if (_isFunction(list)) {
        return filtering(pred);
    }
    // Array case
    var idx = -1, len = list.length, result = [];
    while (++idx < len) {
        if (pred(list[idx])) {
            result[idx] = list[idx];
        }
    }
    return result;
});


module.exports = {
  map: map,
  filter: filter
};


// 
// The problem with this approach is that it breaks composition. 
// If `compose(map(f1), filter(f2))` then `map` takes `filter` for its 
// second argument and starts executing. Oops.


var _isArray = Array.isArray || function _isArray(val) {
    return (val != null &&
            val.length >= 0 &&
            Object.prototype.toString.call(val) === '[object Array]');
};


function _hasMethod(methodName, obj) {
    return obj != null && !_isArray(obj) && typeof obj[methodName] === 'function';
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


var tmap = _curry2(function _map(fn, list) {
    if (hasMethod('map', list)) {
        return list.map(fn);
    }
    var idx = -1, len = list.length, result = new Array(len);
    while (++idx < len) {
        result[idx] = fn(list[idx]);
    }
    return result;
});

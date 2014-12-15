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

function _isTransformer(obj){
    return obj != null &&
      (obj[symTransformer] != null) ||
        (_isFunction(obj.step) && _isFunction(obj.result));
}

function _transformer(obj){
    // precondition: _isTransformer
    return obj[symTransformer] || obj;
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


module.exports = _curry2(function _map(fn, list) {
    if (_hasMethod('map', list)) {
        return list.map(fn);
    } else if(_isTransformer(list)){
        return new Map(fn, _transformer(list));
    }
    var idx = -1, len = list.length, result = new Array(len);
    while (++idx < len) {
        result[idx] = fn(list[idx]);
    }
    return result;
});

function Map(f, xf) {
  this.xf = xf;
  this.f = f;
}
Map.prototype.init = function(){
  return this.xf.init();
};
Map.prototype.result = function(result){
  return this.xf.result(result);
};
Map.prototype.step = function(result, input) {
  return this.xf.step(result, this.f(input));
};

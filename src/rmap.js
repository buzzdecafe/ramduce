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
      (obj[symTransformer] !== void 0) ||
        (_isFunction(obj.step) && _isFunction(obj.result));
}

function _transformer(value){
  var xf;
  if(isTransformer(value)){
    xf = value[symTransformer];
    if(xf === void 0){
      xf = value;
    }
  }
  return xf;
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


var map = _curry2(function _map(fn, list) {
    // Functor case
    if (_hasMethod('map', list)) {
        return list.map(fn);
    }
    // Transducer case
    if(_isTransformer(list)){
        return new Map(fn, list);
    }
    // Array case (yes, I know it's a functor...)
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

module.exports = map


var symbolExists = typeof Symbol !== 'undefined',
    symTransformer = symbolExists ? Symbol('transformer') : '@@transformer',
    symIterator = symbolExists ? Symbol('iterator') : '@@iterator';

function identity(x) {
    return x;
}

function appendTo(acc, x){
    return acc.concat([x]);
}

var mixin = _curry2(function mixin(a, b) {
    return _extend(_extend({}, a), b);
});

function _extend(destination, other) {
    var props = Object.keys(other),
        idx = -1, length = props.length;
    while (++idx < length) {
        destination[props[idx]] = other[props[idx]];
    }
    return destination;
}

function _hasMethod(name, obj) {
     return obj != null && !Array.isArray(obj) && typeof obj[name] === 'function';
}

function _isTransformer(obj) {
    return obj != null &&
      ((obj[symTransformer] != null) ||
      (typeof obj.step === 'function' && typeof obj.result === 'function'));
}

function _isIterable(value) {
  return (value[symIterator] !== void 0);
}

function _isIterator(value) {
  return _isIterable(value) || typeof value.next === 'function';
}

function _noArgsException() {
     return new TypeError('Function called with no arguments');
}

function _curry2(fn) {
    return function(a, b) {
      switch (arguments.length) {
        case 0:
          throw _noArgsException();
        case 1:
          return function(b) {
            return fn(a, b);
          };
        default:
          return fn(a, b);
      }
    };
}

function _curry3(fn) {
    return function(a, b, c) {
      switch (arguments.length) {
        case 0:
          throw _noArgsException();
        case 1:
          return _curry2(function(b, c) {
            return fn(a, b, c);
          });
        case 2:
          return function(c) {
            return fn(a, b, c);
          };
        default:
          return fn(a, b, c);
      }
    };
}

function _curry4(fn) {
    return function(a, b, c, d) {
      switch (arguments.length) {
        case 0:
          throw _noArgsException();
        case 1:
          return _curry2(function(b, c, d) {
            return fn(a, b, c, d);
          });
        case 2:
          return function(c, d) {
            return fn(a, b, c, d);
          };
        case 3:
          return function(d) {
            return fn(a, b, c, d);
          };
        default:
          return fn(a, b, c, d);
      }
    };
}

function init() {
    return this.xf.init();
}

function result(x) { 
     return this.xf.result(x); 
}

function arrayReduce(xf, acc, ls) {
    var i = -1, len = ls.length;
    while(++i < len) {
        acc = xf.step(acc, ls[i]);
        if (acc.__transducers_reduced__) {
            acc = acc.value;
            break;
        }
    }
    return xf.result(acc);
}

function iterableReduce(xf, acc, iter) {
    if(iter[symIterator]) {
        iter = iter[symIterator]();
    }
    var step = iter.next();
    while(!step.done) {
      acc = xf.step(acc, step.value);
      if(acc.__transducers_reduced__) {
        acc = acc.value;
        break;
      }
      step = iter.next();
    }
    return xf.result(acc);
}


var appendXf = {
    step: appendTo,
    result: identity
};


function arity(n, fn) {
    switch (n) {
        case 0: return function() {return fn.apply(this, arguments);};
        case 1: return function(a0) {void a0; return fn.apply(this, arguments);};
        case 2: return function(a0, a1) {void a1; return fn.apply(this, arguments);};
        case 3: return function(a0, a1, a2) {void a2; return fn.apply(this, arguments);};
        case 4: return function(a0, a1, a2, a3) {void a3; return fn.apply(this, arguments);};
        case 5: return function(a0, a1, a2, a3, a4) {void a4; return fn.apply(this, arguments);};
        case 6: return function(a0, a1, a2, a3, a4, a5) {void a5; return fn.apply(this, arguments);};
        case 7: return function(a0, a1, a2, a3, a4, a5, a6) {void a6; return fn.apply(this, arguments);};
        case 8: return function(a0, a1, a2, a3, a4, a5, a6, a7) {void a7; return fn.apply(this, arguments);};
        case 9: return function(a0, a1, a2, a3, a4, a5, a6, a7, a8) {void a8; return fn.apply(this, arguments);};
        case 10: return function(a0, a1, a2, a3, a4, a5, a6, a7, a8, a9) {void a9; return fn.apply(this, arguments);};
        default: throw new Error('First argument to arity must be a non-negative integer no greater than ten');
    }
}

function _createComposer(composeFunction) {
    return function() {
        switch (arguments.length) {
            case 0: throw _noArgsException();
            case 1: return arguments[0];
            default:
                var idx = arguments.length - 1, fn = arguments[idx], length = fn.length;
                while (idx--) {
                    fn = composeFunction(arguments[idx], fn);
                }
                return arity(length, fn);
        }
    };
}

function _compose(f, g) {
    return function() {
        return f.call(this, g.apply(this, arguments));
    };
}


module.exports = {
  identity: identity,
  appendTo: appendTo,
  mixin: mixin,
  appendXf: appendXf,
  arity: arity,
  arrayReduce: arrayReduce,
  compose: _createComposer(_compose),
  init: init,
  iterableReduce: iterableReduce,
  result: result,
  symTransformer: symTransformer,
  _curry2: _curry2,
  _curry3: _curry3,
  _curry4: _curry4,
  _hasMethod: _hasMethod,
  _isTransformer: _isTransformer,
  _isIterable: _isIterable,
  _isIterator: _isIterator,
  _noArgsException: _noArgsException
};

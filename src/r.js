var R = {};

var symbolExists = typeof Symbol !== 'undefined',
    symTransformer = symbolExists ? Symbol('transformer') : '@@transformer',
    symIterator = symbolExists ? Symbol('iterator') : '@@iterator';

function _hasMethod(name, obj) {
     return obj != null && !Array.isArray(obj) && typeof obj[name] === 'function'
}

function _isTransformer(obj) {
    return obj != null &&
      ((obj[symTransformer] != null) ||
      (typeof obj.step === 'function' && typeof obj.result === 'function'));
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
      if(iacc.__transducers_reduced__) {
        acc = acc.value;
        break;
      }
      step = iter.next();
    }
    return xf.result(acc);
};


var appendXf = {
    step: function appendTo(acc, x) {
        return acc.concat([x]);
    },
    result: function I(x) { return x; }
}


//-----------------------------------------------
// MAPPING
var Map = function Map(f, xf) {
    this.f = f;
    this.xf = xf;
};
Map.prototype.init = init;
Map.prototype.result = result;
Map.prototype.step = function(result, input) {
    return this.xf.step(result, this.f(input));
};
R.map = _curry2(function map(fn, ls) {
    // functor dispatch, excluding array
    if (_hasMethod('map', ls)) {
        return ls.map(fn);
    }
    // iterables, incl. array
    if (_isTransformer(ls)) {
        return new Map(fn, ls);
    }
    return R.reduce(new Map(fn, appendXf), [], ls);
});
//-----------------------------------------------

//-----------------------------------------------
// FILTERING
var Filter = function Filter(f, xf) {
    this.f = f;
    this.xf = xf;
};
Filter.prototype.init = init;
Filter.prototype.result = result;
Filter.prototype.step = function(result, input) {
    return this.f(input) ? this.xf.step(result, input) : result;
};
R.filter = _curry2(function(fn, ls) {
    // functor dispatch, excluding array
    if (_hasMethod('filter', ls)) {
        return ls.filter(fn);
    }
    if (_isTransformer(ls)) {
        return new Filter(fn, ls);
    }
    return R.reduce(new Filter(fn, appendXf), [], ls);
});
//-----------------------------------------------

//-----------------------------------------------
// TAKING
var Take = function Take(n, ls) {
    this.n = n;
    this.xf = ls;
};
Take.prototype.init = init;
Take.prototype.result = result;
Take.prototype.step = function(acc, x) {
    return this.n-- > 0 ? this.xf.step(acc, x) :
        x.__transducers_reduced__ ? x : {value: x, __transducers_reduced__: true};
};
R.take = _curry2(function take(n, ls) {
    if (_isTransformer(ls)) {
        return new Take(n, ls);
    }
    return R.reduce(new Take(n, appendXf), [], ls);
});
//-----------------------------------------------

//-----------------------------------------------
// FOLDING
R.reduce = _curry3(function(fn, acc, ls) {
    if (Array.isArray(ls)) {
        return arrayReduce(fn, acc, ls);
    } else if (isIterable(ls)) {
        return iterableReduce(fn, acc, ls);
    } else {
        throw new Error("didn't account for " + typeof ls);
    }
});
//-----------------------------------------------

//-----------------------------------------------
// TRANSDUCING
R.transduce = _curry4(function(xf, fn, acc, ls) {
    return reduce(xf(fn), acc, ls);
});
//-----------------------------------------------

//-----------------------------------------------
// COMPOSING
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

var compose = _createComposer(_compose);
R.compose = compose;
//-----------------------------------------------





module.exports = R;

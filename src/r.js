var R = {};

function _hasMethod(name, obj) {
     return obj != null && !Array.isArray(obj) && typeof obj[name] === 'function'
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
    if(iter["@@iterator"]) {
        iter = iter["@@iterator"]();
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

//-----------------------------------------------
// MAPPING
var Map = _curry2(function Map(f, xf) {
    this.f = f;
    this.xf = xf;
});
Map.prototype.init = init;
Map.prototype.result = result;
Map.prototype.step = function(result, input) {
    return this.xf.step(result, this.f(input));
};
R.map = _curry2(function map(fn, ls) {
    // functor dispatch, excluding array
    if (hasMethod('map', ls)) {
        return ls.map(fn);
    }
    // iterables, incl. array
    return new Map(fn, ls);
});
//-----------------------------------------------

//-----------------------------------------------
// FILTERING
var Filter = _curry2(function Filter(f, xf) {
    this.f = f;
    this.xf = xf;
});
Filter.prototype.init = init;
Filter.prototype.result = result;
Filter.prototype.step = function(result, input) {
    return this.f(input) ? this.xf.step(result, input) : result;
};
R.filter = _curry2(function(fn, ls) {
    return new Filter(fn, ls);
});
//-----------------------------------------------

//-----------------------------------------------
// TAKING
var Take = _curry2(function Take(n, ls) {
    this.n = n;
    this.xf = ls;
});
Take.prototype.init = init;
Take.prototype.result = result;
Take.prototype.step = function(acc, x) {
    return this.n-- > 0 ? this.xf.step(acc, x) :
        x.__transducers_reduced__ ? x : {value: x, __transducers_reduced__: true};
};
R.take = _curry2(function take(n, ls) {
    return new Take(n, ls);
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







module.exports = R;

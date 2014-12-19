var R = {};

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

function init() {
    return this.xf.init();
}

function result(x) { 
     return this.xf.result(x); 
}

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
R.map = _curry2(function map(fn, ls) {});
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
R.filter = _curry2(function(fn, ls) {});
//-----------------------------------------------

//-----------------------------------------------
// FOLDING
R.reduce = _curry3(function(fn, acc, ls) {});

//-----------------------------------------------

//-----------------------------------------------
// TAKING
R.take = _curry2(function take(n, ls) {});
//-----------------------------------------------

//-----------------------------------------------
// TRANSDUCING
R.transduce = function(xf, fn, acc, ls) {
    return reduce(xf(fn), acc, ls);
};
//-----------------------------------------------







module.exports = R;

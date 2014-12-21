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
}

function _appendXf(obj){
  // something like this...
  // from github.com/transduce/transformer-protocol
  var xf;
  if(isTransformer(value)){
    xf = value[symTransformer];
    if(xf === undef){
      xf = value;
    }
  } else if(isFunction(value)){
    // might want to skip FunctionTransformer in  Ramda
    xf = new FunctionTransformer(value);
  } else if(Array.isArray(value)){
    xf = new ArrayTransformer(value);
  } else if(is(String)){
    xf = new StringTransformer(value);
  } else if(is(Object)){
    xf = new ObjectTransformer(value);
  }

  if(xf === void 0){
    throw new Error('Cannot create transformer for '+obj);
  }
  return xf;
}
R.appendXf = _appendXf;

function _empty(obj){
  // something like this...
  // also see kevinbeaty/redispatch for potential late registration
  if(Array.isArray(obj)){
    return [];
  } else if(_isIterator(obj)){
    return; // some empty appendable iterator
  } else if(is(String)){
    return '';
  } else if(is(Object)){
    return {};
  }
  throw new Error('Cannot create empty accumulator for '+obj);
}

var _XF_FLAG = {};
function _dispatchable(name, xf, f) {
    return function() {
        var length = arguments.length;
        var obj = arguments[length - 1];
        var args = init(arguments);

        // xCompose case, return transducer
        if(obj === _XF_FLAG) return xf.apply(null, args);

        // functor case, call method on obj
        if(_hasMethod(name, obj)) return obj[name].apply(obj, args);

        // allow overriding xf with function if either xf is not provided
        // or f can be more efficient.
        if(f != null) return f.apply(null, arguments);

        // Use xf to fold (or transduce)
        return foldl(xf.apply(null, args)(_appendXf(obj)), _empty(obj), obj);
     };
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

var xmap = function xmap(f) {
    return function innerXmap(xf) {
        return new Map(f, xf);
    };
};

R.map = _curry2(_dispatchable('map', xmap));

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
R.filter = _curry2(_dispatchable('filter', xfilter));
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
R.take = _curry2(_dispatchable('take', xtake);

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
    return R.reduce(xf(fn), acc, ls);
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


var _xfConvert = function xf_convert(fn) {
    return fn(_XF_FLAG);
};

R.xCompose = function xf_compose() {
    var funcs = R.map(_xfConvert, Array.prototype.slice.call(arguments));
    return compose.apply(null, funcs);
};

var compose = function compose() {
    var fns = arguments;
    var nfns = fns.length;
    return function innerCompose() {
        var val = fns[nfns - 1].apply(null, arguments);
        var i;
        for (i = nfns - 2; i > -1; --i) {
            val = fns[i](val);
        }
        return val;
    }
};

R.compose = compose;
//-----------------------------------------------

// Pushes value on array, using optional constructor arg as default, or [] if not provided
// init will clone the default
// step will push input onto array and return result
// result is identity
function ArrayTransformer(arr){
  this.arrDefault = arr === undef ? [] : arr;
}
ArrayTransformer.prototype.init = function(){
  return slice.call(this.arrDefault);
};
ArrayTransformer.prototype.step = appendTo;
ArrayTransformer.prototype.result = identity;

// Turns a step function into a transfomer with init, step, result (init not supported and will error)
// Like transducers-js Wrap
function FunctionTransformer(step){
  this.step = step;
}
FunctionTransformer.prototype.init = function(){
  throw new Error('Cannot init wrapped function, use proper transformer instead');
};
FunctionTransformer.prototype.step = function(result, input){
  return this.step(result, input);
};
FunctionTransformer.prototype.result = identity;

// Appends value onto string, using optional constructor arg as default, or '' if not provided
// init will return the default
// step will append input onto string and return result
// result is identity
function StringTransformer(str){
  this.strDefault = str === undef ? '' : str;
}
StringTransformer.prototype.init = function(){
  return this.strDefault;
};
StringTransformer.prototype.step = util.stringAppend;
StringTransformer.prototype.result = identity;

// Merges value into object, using optional constructor arg as default, or {} if not provided
// init will clone the default
// step will merge input into object and return result
// result is identity
function ObjectTransformer(obj){
  this.objDefault = obj === undef ? {} : merge({}, obj);
}
ObjectTransformer.prototype.init = function(){
  return merge({}, this.objDefault);
};
ObjectTransformer.prototype.step = merge;
ObjectTransformer.prototype.result = identity;


module.exports = R;

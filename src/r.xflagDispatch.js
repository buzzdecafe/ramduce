var R = {},
    rlib = require('./rlib'),
    _hasMethod = rlib._hasMethod,
    _curry2 = rlib._curry2,
    _curry3 = rlib._curry3,
    _curry4 = rlib._curry4,
    arrayReduce = rlib.arrayReduce,
    iterableReduce = rlib.iterableReduce,
    isTransformer = rlib._isTransformer,
    isIterator = rlib._isIterator,
    identity = rlib.identity,
    appendTo = rlib.appendTo,
    mixin = rlib.mixin,
    is = rlib.is,
    symTransformer = symTransformer,
    init = rlib.init,
    result = rlib.result,
    compose = rlib.compose,
    slice = [].slice;

function _appendXf(obj){
  // something like this...
  // from github.com/transduce/transformer-protocol
  var xf;
  if(isTransformer(obj)){
    xf = obj[symTransformer];
    if(xf === void 0){
      xf = obj;
    }
  } else if(typeof obj === 'function'){
    // might want to skip FunctionTransformer in  Ramda
    xf = new FunctionTransformer(obj);
  } else if(Array.isArray(obj)){
    xf = new ArrayTransformer(obj);
  } else if(is(String)){
    xf = new StringTransformer(obj);
  } else if(is(Object)){
    xf = new ObjectTransformer(obj);
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
  } else if(isIterator(obj)){
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
        var args = slice.call(arguments, 0, -1);

        // xCompose case, return transducer
        if(obj === _XF_FLAG) return xf.apply(null, args);

        // functor case, call method on obj
        if(_hasMethod(name, obj)) return obj[name].apply(obj, args);

        // allow overriding xf with function if either xf is not provided
        // or f can be more efficient.
        if(f != null) return f.apply(null, arguments);

        // Use xf to fold (or transduce)
        return transduce(xf.apply(null, args), _appendXf(obj), _empty(obj), obj);
     };
}


//-----------------------------------------------
// MAPPING
function Map(f, xf) {
    this.f = f;
    this.xf = xf;
}
Map.prototype.init = init;
Map.prototype.result = result;
Map.prototype.step = function(result, input) {
    return this.xf.step(result, this.f(input));
};

function xmap(f) {
  return function(xf){
    return new Map(f, xf);
  };
}
R.map = _curry2(_dispatchable('map', xmap));

//-----------------------------------------------

//-----------------------------------------------
// FILTERING
function Filter(f, xf) {
    this.f = f;
    this.xf = xf;
}
Filter.prototype.init = init;
Filter.prototype.result = result;
Filter.prototype.step = function(result, input) {
    return this.f(input) ? this.xf.step(result, input) : result;
};
function xfilter(f) {
  return function(xf){
    return new Filter(f, xf);
  };
}
R.filter = _curry2(_dispatchable('filter', xfilter));
//-----------------------------------------------

//-----------------------------------------------
// TAKING
function Take(n, xf) {
    this.n = n;
    this.xf = xf;
}
Take.prototype.init = init;
Take.prototype.result = result;
Take.prototype.step = function(acc, x) {
    return this.n-- > 0 ? this.xf.step(acc, x) :
        x.__transducers_reduced__ ? x : {value: x, __transducers_reduced__: true};
};
function xtake(n){
  return function(xf){
    return new Take(n, xf);
  };
}
R.take = _curry2(_dispatchable('take', xtake));

//-----------------------------------------------

//-----------------------------------------------
// FOLDING
R.foldl = _curry3(function(fn, acc, ls) {
    if (Array.isArray(ls)) {
        return arrayReduce(fn, acc, ls);
    } else if (isIterator(ls)) {
        return iterableReduce(fn, acc, ls);
    } else {
        throw new Error("didn't account for " + typeof ls);
    }
});
//-----------------------------------------------

//-----------------------------------------------
// TRANSDUCING
var transduce = R.transduce = _curry4(function(xf, fn, acc, ls) {
    return R.foldl(xf(fn), acc, ls);
});
//-----------------------------------------------

//-----------------------------------------------
var _xfConvert = function xf_convert(fn) {
    return fn(_XF_FLAG);
};

R.xCompose = function xf_compose() {
    var funcs = R.map(_xfConvert, Array.prototype.slice.call(arguments));
    return compose.apply(null, funcs);
};

R.compose = compose;
//-----------------------------------------------

// Pushes value on array, using optional constructor arg as default, or [] if not provided
// init will clone the default
// step will push input onto array and return result
// result is identity
function ArrayTransformer(arr){
  this.arrDefault = arr === void 0 ? [] : arr;
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
  this.strDefault = str === void 0 ? '' : str;
}
StringTransformer.prototype.init = function(){
  return this.strDefault;
};
StringTransformer.prototype.step = function(acc, x){
  return acc + x;
};
StringTransformer.prototype.result = identity;

// Merges value into object, using optional constructor arg as default, or {} if not provided
// init will clone the default
// step will merge input into object and return result
// result is identity
function ObjectTransformer(obj){
  this.objDefault = obj === void 0 ? {} : mixin({}, obj);
}
ObjectTransformer.prototype.init = function(){
  return mixin({}, this.objDefault);
};
ObjectTransformer.prototype.step = mixin;
ObjectTransformer.prototype.result = identity;


module.exports = R;

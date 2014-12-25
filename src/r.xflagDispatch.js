var R = {},
    rlib = require('./rlib'),
    _hasMethod = rlib._hasMethod,
    _curry2 = rlib._curry2,
    _curry3 = rlib._curry3,
    _curry4 = rlib._curry4,
    arrayReduce = rlib.arrayReduce,
    iterableReduce = rlib.iterableReduce,
    reduced = rlib.reduced,
    always = rlib.always,
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
    pipe = rlib.pipe,
    slice = [].slice;

var _appendXfArray = {
    init: function(){
      return [];
    },
    step: appendTo,
    result: identity
};

var _appendXfString = {
    init: function(){
      return '';
    },
    step: function(acc, x){
      return acc + x;
    },
    result: identity
};

var _appendXfObject = {
    init: function(){
      return {};
    },
    step: mixin,
    result: identity
};

function _appendXf(obj){
  // something like this...
  // from github.com/transduce/transformer-protocol
  // also see kevinbeaty/redispatch for potential late registration
  if(isTransformer(obj)){
    var xf = obj[symTransformer];
    if(xf === void 0){
      xf = obj;
    }
    return xf;
  }

  if(Array.isArray(obj)){
    return _appendXfArray;
  }

  if(is(String)){
    return _appendXfString;
  }

  if(is(Object)){
    return _appendXfObject;
  }

  throw new Error('Cannot create transformer for '+obj);
}
R.appendXf = _appendXf;

function LastValue(init){
  this.initialValue = init;

  // OR, allow overriding init as function if necessary
  // Can use always(-1) etc. instead of -1 constant
  //if(typeof init === 'function'){
  //  this.init = init;
  // }
}
LastValue.prototype.init = function(){ return this.initialValue; };
LastValue.prototype.step = function(acc, x){ return x; };
LastValue.prototype.result = identity;

function _appendXfLastValue(init){
  // wrap in always because dispatch below calls function with
  // obj to match _appendXf(obj)
  return always(new LastValue(init));
}

function _dispatch(xf, appendXf){
    appendXf = appendXf || _appendXf;
    return function(){
        var transducer = xf.apply(null, arguments);
        var obj = this;
        if(obj === _XF_FLAG) return transducer;

        var stepper = appendXf(obj);
        return _foldl(transducer(stepper), stepper.init(), obj);
    };
}

var _XF_FLAG = {};
function _dispatchable(name, f) {
    return function() {
        var length = arguments.length;
        var args = slice.call(arguments, 0, -1);
        var obj = arguments[length - 1];

        var fn = f;
        if(_hasMethod(name, obj)){
          fn = obj[name];
        }

        return fn.apply(obj, args);
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

var xmap = _curry2(function(f, xf) {
  return new Map(f, xf);
});
R.map = _curry2(_dispatchable('map', _dispatch(xmap)));

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
var xfilter = _curry2(function(f, xf) {
  return new Filter(f, xf);
});
R.filter = _curry2(_dispatchable('filter', _dispatch(xfilter)));
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
var xtake = _curry2(function xtake(n, xf){
  return new Take(n, xf);
});
R.take = _curry2(_dispatchable('take', _dispatch(xtake)));

//-----------------------------------------------
// FINDING
function Find(f, xf) {
    this.f = f;
    this.xf = xf;
}
Find.prototype.init = init;
Find.prototype.result = result;
Find.prototype.step = function(acc, x) {
    if(this.f(x)){
      return reduced(this.xf.step(acc, x));
    }
    return acc;
};
var xfind = _curry2(function xfind(f, xf){
  return new Find(f, xf);
});
R.find = _curry2(_dispatchable('find', _dispatch(xfind, _appendXfLastValue(void 0))));

//-----------------------------------------------

//-----------------------------------------------
// FOLDING
R.foldl = _curry3(_foldl);
function _foldl(fn, acc, ls) {
    if (Array.isArray(ls)) {
        return arrayReduce(fn, acc, ls);
    } else if (isIterator(ls)) {
        return iterableReduce(fn, acc, ls);
    } else {
        throw new Error("didn't account for " + typeof ls);
    }
}
//-----------------------------------------------

//-----------------------------------------------
// TRANSDUCING
R.transduce = _curry4(function(xf, fn, acc, ls) {
    return _foldl(xf(fn), acc, ls);
});

//-----------------------------------------------

//-----------------------------------------------
function _xfConvert(fn) {
    return fn(_XF_FLAG);
}

R.tCompose = function xCompose() {
    var funcs = R.map(_xfConvert, slice.call(arguments));
    return compose.apply(null, funcs);
};

R.tPipe = function xPipe() {
    var funcs = R.map(_xfConvert, slice.call(arguments));
    return pipe.apply(null, funcs);
};

R.compose = compose;
//-----------------------------------------------
module.exports = R;

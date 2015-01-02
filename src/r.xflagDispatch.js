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

//-----------------------------------------------
// appendXf
var _appendXf = R.appendXf = (function(){
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

  return _appendXf;
})();

//-----------------------------------------------
// _appendXfLastValue

var _appendXfLastValue = (function(){
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

  return _appendXfLastValue;
})();

//-----------------------------------------------
// _transduceDispatch
function _transduceDispatch(xf, appendXf){
    return function _xfDispatch(){
        var obj = this;
        var transducer = xf.apply(null, arguments);

        if(isTransformer(obj)) {
          return transducer(obj);
        }

        var stepper = appendXf(obj);
        return _foldl(transducer(stepper), stepper.init(), obj);
    };
}

//-----------------------------------------------
// _dispatchable
function _dispatchable(name, f){
  return function _dispatch(){
    var length = arguments.length - 1;
    var args = slice.call(arguments, 0, length);
    var obj = arguments[length];
    var fn = f;
    if(_hasMethod(name, obj)){
      fn = obj[name];
    }
    return fn.apply(obj, args);
  };
}

//-----------------------------------------------
// MAPPING

var _xmap = (function(){
  function Map(f, xf) {
      this.f = f;
      this.xf = xf;
  }
  Map.prototype.init = init;
  Map.prototype.result = result;
  Map.prototype.step = function(result, input) {
      return this.xf.step(result, this.f(input));
  };

  return _curry2(function(f, xf) {
    return new Map(f, xf);
  });
})();

R.map = _curry2(_dispatchable('map', _transduceDispatch(_xmap, _appendXf)));

//-----------------------------------------------

//-----------------------------------------------
// FILTERING
var _xfilter = (function(){
  function Filter(f, xf) {
      this.f = f;
      this.xf = xf;
  }
  Filter.prototype.init = init;
  Filter.prototype.result = result;
  Filter.prototype.step = function(result, input) {
      return this.f(input) ? this.xf.step(result, input) : result;
  };
  return _curry2(function(f, xf) {
    return new Filter(f, xf);
  });
})();

R.filter = _curry2(_dispatchable('filter', _transduceDispatch(_xfilter, _appendXf)));

//-----------------------------------------------

//-----------------------------------------------
// TAKING
var _xtake = (function(){
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
  return _curry2(function xtake(n, xf){
    return new Take(n, xf);
  });
})();

R.take = _curry2(_dispatchable('take', _transduceDispatch(_xtake, _appendXf)));

//-----------------------------------------------
// FINDING
var _xfind = (function(){
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
  return _curry2(function xfind(f, xf){
    return new Find(f, xf);

  });
})();

R.find = _curry2(_dispatchable('find', _transduceDispatch(_xfind, _appendXfLastValue(void 0))));

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
// TRANSDUCING
R.transduce = _curry4(function(xf, fn, acc, ls) {
    return _foldl(xf(fn), acc, ls);
});

R.into = _curry3(function(to, transducer, from){
    var init, stepper;
    if(isTransformer(to)){
        stepper = to;
        init = stepper.init();
    } else {
        stepper = _appendXf(to);
        init = to;
    }
    return _foldl(transducer(stepper), init, from);
});

//-----------------------------------------------
R.compose = compose;
R.pipe = pipe;
module.exports = R;

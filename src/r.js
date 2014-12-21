var rlib = require('./rlib');

var R = {};

// stuff we need
var _hasMethod = rlib._hasMethod;
var _isTransformer = rlib._isTransformer;
var _noArgsException = rlib._noArgsException;
var _curry2 = rlib._curry2
var _curry3 = rlib._curry3
var _curry4 = rlib._curry4
var init = rlib.init;
var result = rlib.result;
var arrayReduce = rlib.arrayReduce;
var iterableReduce = rlib.iterableReduce;
var appendXf = rlib.appendXf;
// end stuff we need



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
R.compose = rlib.compose;
//-----------------------------------------------





module.exports = R;

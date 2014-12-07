function collReduce(coll, fn, init) {
  // hmmmm https://github.com/clojure/clojure/blob/1280c5c2d2b58929f0a3c8e34ee6084533982793/src/clj/clojure/core/protocols.clj
}

function isReduced(x) {
  return x.__reduced__ === true;
}

function transduce(xform, fn, init, coll) {
  var f = xform(fn);
  var ret = hasMethod("reduce", coll) ? 
    //then: (.reduce ^clojure.lang.IReduceInit coll f init) hmmmm
    coll.reduce(f, init) : //???
    //else: (clojure.core.protocols/coll-reduce coll f init);
    collReduce(coll, f, init); //???
  return f(ret);
}

function reduce(fn, acc, list) {
  var idx = -1, len = list.length;
  while (++idx < len) {
    acc = fn(acc, list[idx]);
    if (isReduced(acc)) { return acc; }
  }
  return acc;
}

function mapping(fn) {
  return function(stepFn) {
    return function(acc, x) {
      return stepFn(acc, fn(x));
    };
  };
}
// var mapping = curry(function(fn, stepFn, acc, x) {
//   return stepFn(acc, f(x));
// });

function filtering(pred) {
  return function(stepFn) {
    return function(acc, x) {
      return pred(x) ? stepFn(acc, x) : acc;
    };
  };
}
// var filtering = curry(function(pred, stepFn, acc, x) {
//   return pred(x) ? stepFn(acc, x) : acc;
// });



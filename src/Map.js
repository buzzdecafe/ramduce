var curry = require('ramda').curry;

// beatty's `map` transducer
//
"use strict";
var map = curry(function tmap(callback, xf) {
  return new Map(callback, xf);
});

function Map(f, xf) {
  this.xf = xf;
  this.f = f;
}
Map.prototype.init = function(){
  return this.xf.init();
};
Map.prototype.result = function(result){
  return this.xf.result(result);
};
Map.prototype.step = function(result, input) {
  return this.xf.step(result, this.f(input));
};

module.exports = map

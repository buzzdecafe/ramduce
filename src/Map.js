// `map` transducer

function __base__(id) {
  return function(xform, f) {
    this.xform = xform;
    this.f = f;
  }
}

var Map = __base__('Map');
var Reduce = __base__('Reduce');





var Map = require('./Map');
var rmap = require('./rmap');
var reduce = require('./reduce');

var square = function(x) { return x * x; };
var gt5 = function(x) { return x > 5; };
var appendTo = function(acc, x) { return acc.concat(x); };
var xducers = { map: Map };


// rmap :: f -> xf -> xf
var xf = rmap(square, xducers);
var res1 = reduce(xf(appendTo), [], [1,2,3,4,5]);


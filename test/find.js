var assert = require('assert');

var TEST_TYPE = process.env.TEST_TYPE,
    R = require(TEST_TYPE ? '../src/r.'+TEST_TYPE : '../src/r');

if(!R.find){
  return;
}


describe('find', function() {
    var even = function(x) {return x % 2 === 0;};
    var f = function(){ return false; };

    it('finds item over arrays', function() {
        assert.strictEqual(R.find(even, [1, 2, 3, 4]), 2);
    });

    it('default undefined', function() {
        assert.strictEqual(R.find(f, [1, 2, 3, 4]), void 0);
    });

    it('dispatches to objects that implement `find`', function() {
        var obj = {x: 100, find: function(f) { return f(this.x); }};
        assert.strictEqual(R.find(even, obj), true);
    });

    it('is automatically curried', function() {
        var inc = R.find(even);
        assert.strictEqual(inc([1, 2, 3]), 2);
    });

    it('correctly reports the arity of curried versions', function() {
        var inc = R.find(even);
        assert.strictEqual(inc.length, 1);
    });

});

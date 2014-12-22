var assert = require('assert');

var TEST_TYPE = process.env.TEST_TYPE,
    R = require(TEST_TYPE ? '../src/r.'+TEST_TYPE : '../src/r');


describe('map', function() {
    var times2 = function(x) {return x * 2;};
    var add1 = function(x) {return x + 1;};

    it('maps simple functions over arrays', function() {
        assert.deepEqual(R.map(times2, [1, 2, 3, 4]), [2, 4, 6, 8]);
    });

    it('dispatches to objects that implement `map`', function() {
        var obj = {x: 100, map: function(f) { return f(this.x); }};
        assert.strictEqual(R.map(add1, obj), 101);
    });

/* No longer supported...
    it('dispatches to transformer objects', function() {
        var obj = {
            step: function(acc, x) { return acc.concat(x); },
            result: function(x) { return x; }
        };
        assert.deepEqual(R.map(add1, obj), {
            f: add1,
            xf: obj
        });
    });
    */

    it('is automatically curried', function() {
        var inc = R.map(add1);
        assert.deepEqual(inc([1, 2, 3]), [2, 3, 4]);
    });

    it('correctly reports the arity of curried versions', function() {
        var inc = R.map(add1);
        assert.strictEqual(inc.length, 1);
    });

});

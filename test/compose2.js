var assert = require('assert');

var TEST_TYPE = process.env.TEST_TYPE,
    R = require(TEST_TYPE ? '../src/r.'+TEST_TYPE : '../src/r'),
    r = require('ramda');

describe('compose', function() {
    var times2 = function(x) {return x * 2;};
    var add1 = function(x) {return x + 1;};
    var isOdd = function(x) {return x % 2 === 1;};
    var square = function(x) { return x * x; };

    it('should maintain composition order for arrays', function() {
        var rOld = r.compose(r.map(times2), r.map(add1));
        var input = [-1, 0, 5];

        // make sure map still works
        assert.deepEqual(R.map(add1, input), [0, 1, 6]);
        if (process.env.TEST_TYPE === 'transduceCompose') {
            var rNew = R.xCompose(R.map(add1), R.map(times2));
            assert.deepEqual(R.transduce(rNew, R.appendXf, [], input), rOld(input));

            var rNew2 = R.xCompose(R.map(square), R.map(add1), R.map(add1));
            var combo = R.compose(rNew2, rNew);
            // everything unfolds left to right
            // eg: -1 ^2 -> 1 +1 -> 2 +1 -> 3 +1 -> 4 *2 -> 8
            assert.deepEqual(R.transduce(combo, R.appendXf, [], input), [8, 6, 56]);
        } else {
            // something else..
        }
        return;
        assert.deepEqual(rNew(input), [1, 3, 3, 5]);

        rOld = r.compose(r.map(times2), r.filter(isOdd), r.map(add1));
        rNew = R.compose(R.map(times2), R.filter(isOdd), R.map(add1));
        input = [-1, 0, 2, 2, 3, 3, 4, 5];
        assert.deepEqual(rNew(input), rOld(input));
        assert.deepEqual(rNew(input), [2, 6, 6, 10]);
    });
});

var assert = require('assert');

var TEST_TYPE = process.env.TEST_TYPE,
    R = require(TEST_TYPE ? '../src/r.'+TEST_TYPE : '../src/r'),
    r = require('ramda');


describe('compose', function() {
    var times2 = function(x) {return x * 2;};
    var add1 = function(x) {return x + 1;};
    var isOdd = function(x){return x % 2 === 1;};

    it('should maintain composition order for arrays', function() {
        var rOld = r.compose(r.filter(isOdd), r.map(add1));
        var rNew = R.compose(R.filter(isOdd), R.map(add1));
        var input = [-1, 0, 2, 2, 3, 3, 4, 5];
        assert.deepEqual(rNew(input), rOld(input));
        assert.deepEqual(rNew(input), [1, 3, 3, 5]);

        rOld = r.compose(r.map(times2), r.filter(isOdd), r.map(add1));
        rNew = R.compose(R.map(times2), R.filter(isOdd), R.map(add1));
        input = [-1, 0, 2, 2, 3, 3, 4, 5];
        assert.deepEqual(rNew(input), rOld(input));
        assert.deepEqual(rNew(input), [2, 6, 6, 10]);
    });

    if(typeof R.stepCompose === 'function'){
        it('stepCompose should maintain composition order for arrays', function() {
            var rOld = r.compose(r.filter(isOdd), r.map(add1));
            var rNew = R.stepCompose(R.filter(isOdd), R.map(add1));
            var input = [-1, 0, 2, 2, 3, 3, 4, 5];
            assert.deepEqual(rNew(input), rOld(input));
            assert.deepEqual(rNew(input), [1, 3, 3, 5]);

            rOld = r.compose(r.map(times2), r.filter(isOdd), r.map(add1));
            rNew = R.stepCompose(R.map(times2), R.filter(isOdd), R.map(add1));
            input = [-1, 0, 2, 2, 3, 3, 4, 5];
            assert.deepEqual(rNew(input), rOld(input));
            assert.deepEqual(rNew(input), [2, 6, 6, 10]);
        });
    }
});

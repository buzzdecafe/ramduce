// Notes

/*
So...
we all know that `map` and `filter` (and other list functions) can be implemented in terms of reduce. 
So here is reduce. It takes an arity-2 reducing function, an accumulator, and a list:
*/

function reduce(fn, acc, ls) {
  return (ls.length === 0) ? acc : 
    reduce(fn, fn(acc, head(ls)), tail(ls));
}

/*
`map` is simply a reduce where the accumulator is another list, and the reducing function is `concat`. 
what gives `map` its special flavor is the transforming function `a -> b` that it takes as its first 
argument (`f` in the example below): 
*/

function map(f, ls) {
  return (ls.length === 0) ? [] : 
    reduce(concat, [f(head(ls))], tail(ls));
}

/*
similarly for filter, the reducing function is `concat`, and the accumulator is another list. What 
distinguishes `filter` is that it takes a predicate which decides which elements of the input list 
make it to the output list. Here is `filter` in terms of `reduce`:
*/

function filter(pred, ls) {
  return (ls.length === 0) ? [] :
    reduce(concat, (pred(head(ls)) ? [head(ls)] : []), tail(ls));
}

/*
Both `map` and `filter` take a function and a list. Both rely on `concat` to assemble their output 
list. What is different is how the accumulate their output. Let's see if we can get a lift by 
factoring out the reducing function (i.e. `concat`), and passing in a function to populate the
accumulator:
*/

function ???(stepFn, initFn) {
  return function(fn, ls) {
    return ls.length === 0 ? [] :
      reduce(stepFn, initFn(head(ls)), tail(ls));
}

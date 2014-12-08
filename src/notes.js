// Notes

// Hickey talk notes
//
// using my idiosyncratic type notation ...
/*
put the baggage on the plane 
  as you do that:
    break apart pallets (convert pallets of bags into sets of individual bags: 
        chain/flatMap/mapcat)
    remove bags that smell like food (filter)
    label heavy bags (map)

pipe(
  chain(unbundlePallet),
  filter(nonFood),
  map(labelHeavy)
);
  
How can we use transducers to eliminate intermediate structures?

// Transducer T processBags :: Pallets(?) -> T Bags 
// is that sig right?
processBags = pipe(
  chaining(unbundlePallet), // T chaining :: T(?) -> T
  filtering(nonFood),       // T filtering :: T(?) -> T
  mapping(labelHeavy)       // T mapping :: T(?) -> T
);

Transducer T is a function that takes a transforming/reducing function (acc, x -> acc) 
and returns another Transducer that wraps and transforms that reducing function:

Transducer T :: (acc, x -> acc) -> T (acc, x -> acc)'

into(airplane, processBags(pallets));

`transduce` is like reduce but takes transducers:
transduce :: T -> T

@example:

  transduce(compose(processBags, mapping(weighBag)), add, 0,            pallets);
            ^       ^            ^                   ^    ^             ^
            |       |            |                   |    |             |
          T -> T  T -> T       T -> T       reducing fn  accumulator   data

The transducer can transform the internal reducing function. That is the point.

Defining list functions as fold (right):

function mapr(fn, ls) {
  return foldr(function(acc, x) { return prepend(f(x), acc); }, [], ls);
}

function filterr(pred, ls) {
  return foldr(function(acc, x) { return pred(x) ? prepend(x, acc) : acc; }, [], ls);
}

What is different here? 
  mapr -> return prepend(f(x), acc);
  filterr -> return pred(x) ? prepend(x, acc) : acc 

What is the same?
  EVERYTHING ELSE

Let's implement as left fold:

function mapl(fn, ls) {
  return foldl(function(acc, x) { return append(f(x), acc); }, [], ls);
}

function filterl(pred, ls) {
  return foldl(function(acc, x) { return pred(x) ? append(x, acc) : acc; }, [], ls);
}

function chainl(fn, ls) {
  return foldl(function(acc, x) { 
    return reduce(append, acc, fn(x));
  }, [], ls);
}

right fold -> Laziness path
left fold -> Looping, eager path

All of the implementations rely on `append` -- iteration logic has leaked into the reduction.
Let's get it out of there. We can pass `append` -- or any reducing-type function, i.e. with 
the signature (acc, x -> acc) -- in an decouple it from the reduction.

parameterize the "step function" (`append` in the examples above:

function mapping(fn) {        // pass in the transforming function
  return function(step) {     // <--- pass reducing function (e.g. `append` here)
    return function(acc, x) { // and get out a new reducing function (acc, x -> acc)
      return step(acc, fn(x));
    };
  };
}

this could be rewritten for ramda using currying:

// mapping :: (a -> b) -> ([b], a -> [b]) -> ([b], a -> [b]) 
mapping = curry(function(fn, step) {
  return function(acc, x) {
    return step(acc, fn(x));
  };
});

Likewise for filtering and chaining:

// filtering :: (a -> Boolean) -> ([b], a -> [b]) -> ([b], a -> [b]) 
filtering = curry(function(pred, step) {
  return function(acc, x) {
    return pred(x) ? step(acc, x) : acc;
  };
});

// chaining :: (a -> [b]) -> ([b], a -> [b]) -> ([b], a -> [b]) 
chaining = curry(function(pred, step) {
  return function(acc, x) {
    return foldl(step, acc, x);
  };
});

Now we can redfine `mapl` et al. with a transducer that takes a step function (in 
this case `append`):

function mapl(fn, ls) {
  return foldl(mapping(fn, append), [] ls);
}

function filterl(fn, ls) {
  return foldl(filtering(fn, append), [] ls);
}

function chainl(fn, ls) {
  return foldl(chaining(fn, append), [] ls);
}

Now composition ... flows both ways?!?!

compose(
    chaining(unbundlePallet),
    filtering(nonFood),
    map(labelHeavy)
);

this flows right-to-left as expected for composition, "but it builds a transformation
step that runs in the order that they appear, left-to-right in the [composition]."

!!!!







*/

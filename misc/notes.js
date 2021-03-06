// Notes

// Hickey talk notes
// https://www.youtube.com/watch?v=6mTbuzafcII
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
    return foldl(append, acc, fn(x));
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


Early termination. 

reduce usualyy process all input. How do we signal a transducer to stop taking input?


compose(
    chaining(unbundlePallet),
    takingWhile(nonTicking),
    filtering(nonFood),
    map(labelHeavy)
);

Clojure supports early termination in `foldl` via a `Reduced` wrapper object. hmmm.
Test for it with `reduced?`

So this appears to be a boxy data type similar to Maybe et al. But it's different, 
because Maybe et al. may wrap values that are not reduced.

Rules:

* Transducers *must* support Reduced. step functions may return a reduced value.
* If a Transducer gets a reduced value from a nested step call, it must never call that 
  step function again *with input*. hmmmm


// takingWhile :: (a -> Boolean) -> ([b], a -> [b]) -> ([b], a -> [b]) 
filtering = curry(function(pred, step) {
  return function(acc, x) {
    return pred(x) ? step(acc, x) : reduced(acc); // `reduced` means early termination.
  };
});

So what does `reduced` look like? reduced :: acc -> Reduced acc ?

More rules:

* All step functions must have an arity-1 version that just takes the accumulator
* this "completion operation" must be called once on the final accumulated value *once*
* transducer may flush whatever state it has been accumulating before this completion step

Init

a function to provide the initial accumulator. see foldl1.

Another rule:

* Transducers *must* support arity-0 `init` in terms of a call to nested `step`

Ultimately we get a set of three operations:

init     arity-0
complete arity-1
step     arity-2

(init, complete, step) -> (init, complete, step)'

*/

// More research ...
/*
Clojure implementation of `reduce`:
https://github.com/clojure/clojure/blob/clojure-1.6.0/src/clj/clojure/core.clj#L6275

"f should be a function of 2 arguments. If val is not supplied,
  returns the result of applying f to the first 2 items in coll, then
  applying f to that result and the 3rd item, etc. 
  
variadic--the accummulator will be generated `foldl``-style if not supplied.
So what happens if the `coll` is empty?

  "If coll contains no
  items, f must accept no arguments as well, and reduce returns the
  result of calling f with no arguments."  

well that answers that
  
  "If coll has only 1 item, it
  is returned and f is not called."
  
there is a lot of sanity-chacking going on here.
  
  "If val is supplied, returns the
  result of applying f to val and the first item in coll, then
  applying f to that result and the 2nd item, etc. If coll contains no
  items, returns val and f is not called."

the variadic way is not possible when currying `reduce`. So this is the only
part of the definition we can keep.

Now have a look at:
https://github.com/clojure/clojure/blob/master/src/clj/clojure/core/protocols.clj#L75

clojure is explicitly testing whether the accumulator is `reduced?` and should
terminate early:

([coll f val]
      (let [iter (.iterator coll)]
        (loop [ret val]
          (if (.hasNext iter)
            (let [ret (f ret (.next iter))]
                (if (reduced? ret)           ; <-- there it is
                  @ret
                  (recur ret)))
            ret)))))

So what does `reduced?` look like?
https://github.com/clojure/clojure/blob/eccff113e7d68411d60f7204711ab71027dc5356/src/clj/clojure/core.clj#L2694

essentially, if the accumulator is an instance of `Reduced`, then it is reduced:
https://github.com/clojure/clojure/blob/9aaee3c111ce18b9b70695dd45a04b401a174113/src/jvm/clojure/lang/RT.java#L1756

Clojure does this by wrapping the accumulator in a `Reduced` object with a call to `(reduced x)`
https://github.com/clojure/clojure/blob/eccff113e7d68411d60f7204711ab71027dc5356/src/clj/clojure/core.clj#L2694

*/

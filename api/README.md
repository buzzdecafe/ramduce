Transducers API for Ramda
=========================

What we want:

* Composition. Transducer composition should be as easy as any other function composition. 
it would be ideal to be able to use existing `compose` either as-is, or by passing some indicator 
to tell it how to compose.

* Integration. It would be nice to use existing Functor methods to support Transducers as well.
This includes pretty much *any function that takes a list in the final position*.


```javascript
f = compose(map(square), filter(gt4)); 
// f is a:
//    function from [] -> []
f([2,3,4,5,6,7]); //=> [25, 36, 49]
//    function from xf -> transducer
f({step: stepFn, result: resFn}); //=> T : {f: f, step: stepFn, result: resFn}
```

Two API alternatives
--------------------

1. Do it all transparently, e.g., `map(f) :: functor -> functor | transformer -> transducer`. This 
   means making every list function accept transformer. We may be able to get iterator support at 
   the same time.
2. Let the user do it, e.g., `map(f) :: functor -> functor`, and 
   `trans(map(f)) :: transformer -> transducer` This may be safer, but expects the user to know 
   how these things work together.
3. Likewise, `compose`: transparent? or explicit?





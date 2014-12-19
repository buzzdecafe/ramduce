module.exports = function(x) {
    return x.__transducers_reduced__ ? x : 
        { value: x, __transducers_reduced__: true  };
};

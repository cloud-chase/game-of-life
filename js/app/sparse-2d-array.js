
define(function() {
  return {
    new: function() {
      var that = [];
    
      Object.defineProperty(that, 'set', { writable: false, value: function(a, b, value) {
        var slice = that[a];
        if (!slice) {
          slice = that[a] = {};
          // include a non-enumerable 'count' property to keep track of entries
          Object.defineProperty(slice, 'count', { writable: true, value: 1 });
        } else if (!slice[b]) {
          slice.count++;
        }
        slice[b] = value;
      }});

      Object.defineProperty(that, 'delete', { writable: false, value: function(a, b) {
        if (that[a]) {
          delete that[a][b];
          if (--that[a].count === 0) {
            delete that[a];
          }
        }
      }});

      return that;
    }
  };
});


define(function() {

  var that = {};
  
  that.new = function() {
    var self = [];
    
    Object.defineProperty(self, 'set', { writable: false, value: function(a, b, value) {
      var slice = self[a];
      if (!slice) {
        slice = self[a] = {};
        // include a non-enumerable 'count' property to keep track of entries
        Object.defineProperty(slice, 'count', { writable: true, value: 1 });
      } else {
        slice.count++;
      }
      slice[b] = value;
    }});

    Object.defineProperty(self, 'delete', { writable: false, value: function(a, b) {
      if (self[a]) {
        delete self[a][b];
        if (--self[a].count === 0) {
          delete self[a];
        }
      }
    }});
    
    return self;
  };
  
  return that;
});

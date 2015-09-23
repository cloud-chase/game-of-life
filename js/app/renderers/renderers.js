
define(function() {
  var that = {},
      renderers = [
        {
          name: 'DIV',
          file: 'app/renderers/div-renderer'
        }, {
          name: 'HTML Canvas',
          default: true,
          file: 'app/renderers/GoL-canvas-renderer'
        }, {
          name: 'Null',
          file: 'app/renderers/GoL-null-renderer'
        }
      ];
  
  that.list = function() {
    return renderers;
  };
  
  that.get = function(name) {
    return renderers.find(function(element, index, array) {
      return element.name === name;
    });
  };
  
  that.getDefault = function() {
    return renderers.find(function(element, index, array) {
      return element.default;
    }) || renderers[0];
  };
  
  return that;
});

define(function() {
  var that = {}, renderers = [
    {
      name: 'div',
      file: 'app/renderers/div-renderer'
    }, {
      name: 'canvas',
      defaultRenderer: true,
      file: 'app/renderers/GoL-canvas-renderer'
    }, {
      name: 'null',
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
    var r = renderers.find(function(element, index, array) {
      return element.defaultRenderer && element.defaultRenderer === true;
    });
    if (r === undefined) {
      r = renderers[0];
    }
    return r;
  };
  return that;
});

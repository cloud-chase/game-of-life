define(function() {
  var renderers = [
    {
      name: 'div',
      file: 'app/div-renderer'
    }, {
      name: 'canvas',
      file: 'app/GoL-canvas-renderer'
    }, {
      name: 'null',
      file: 'app/GoL-null-renderer'
    }
  ],
  list = function() {
    return renderers;
  },
  get = function(name) {
    return renderers.find(function(element, index, array) {
      return element.name = name;
    });
  },
  require = function(name, callback) {
    var rendererInfo, renderer;

    rendererInfo = get(name);
    requrie([rendererInfo.file], callback);
  };
  return {
    list: list,
    get: get
  };
});

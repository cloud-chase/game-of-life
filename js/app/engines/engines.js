
define(function() {
  var that = {},
      engines = [
        {
          name: 'Game Of Life',
          default: true,
          file: 'app/engines/game-of-life'
        }
      ];
  
  that.list = function() {
    return engines;
  };
  
  that.get = function(name) {
    return engines.find(function(element, index, array) {
      return element.name === name;
    });
  };
  
  that.getDefault = function() {
    return engines.find(function(element, index, array) {
      return element.default;
    }) || engines[0];
  };
  
  return that;
});

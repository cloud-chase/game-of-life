
define(['app/sparse-2d-array', 'app/property-bag'], function(sparse, propertyBag) {

  var ants = [],  // each ant consists of [row, col, ant state, turns]
      properties = propertyBag.new(),
      that = {};

  that.init = function(amodel, cursorShape, engineCursorChanged, $propertyHost) {
    model = amodel;
    engineCursorChanged.fire([[0, 0]]);

    properties.addTextareaProperty('ants', 'Ants',
      "Each ant consists of [row, col, ant state, turns]\n0 <= ant state < 4\nturns is an array of 'L' 'R' strings",
      "[\n[50, 50, 0, ['R', 'L']]\n]", function(value) {
      ants = JSON.parse(value.replace(/'/g, "\""));
    });

    properties.createUI($propertyHost);
  };

  that.clear = function() {
    properties.clear();
  };

  that.stepForward = function() {
    var i, ant, states = 0, cellstates = [];

    for (i in ants) {
      cellstates[i] = model.getCell(ants[i]) || 0;
      states = Math.max(states, ants[i][3].length);
    }

    for (i in ants) {
      ant = ants[i];

      // increment the cell state
      model.setAlive([ant], (1 + (model.getCell(ant) || 0)) % states);

      // turn the ant
      ant[2] = (ant[2] + ((ant[3][cellstates[i] % ant[3].length] === 'R') ? 1 : 3)) % 4;

      // move the ant
      switch (ant[2]) {
        case 0: ant[0]--; break;
        case 1: ant[1]++; break;
        case 2: ant[0]++; break;
        case 3: ant[1]--; break;
      }
    }
  };

  return that;
});


define(['app/sparse-2d-array'], function(sparse) {

  var ants = [],  // each ant consists of [row, col, ant state, turns]
      that = {};
      
  that.init = function(amodel) {
    model = amodel;
    ants = [[50, 50, 0, ['R', 'L']]];
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

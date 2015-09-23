
define(['app/sparse-2d-array'], function(sparse) {

  var extraBirthsRate = 0,
      extraDeathsRate = 0,
      increaseFertilityRate = 0,
      increaseDeathRate = 0,
      model = undefined,
      data = sparse.new(),
      that = {};
      
  that.init = function(amodel) {
    model = amodel;
  };
  
  that.stepForward = function() {
    var possibleBirths = sparse.new(),
        dyingList = [],
        birthList = [],
        r, c, pcell, livens;

    // process living cells to see if they might be deaths
    model.forEachLiving(function(cell) {
      celldata = data[cell[0]] && data[cell[0]][cell[1]];
      livens = model.getCellNeighbours(cell, function(ncell) {
        // add dead neighbours of the living cell to the possible births list
        possibleBirths.set(ncell[0], ncell[1], true);
      });

      if ( (livens < 2) ||
           (livens > 3) ||
           ((extraDeathsRate > 0) && (Math.random() < extraDeathsRate)) ||
           (celldata && (celldata.deathRate > 0) && (Math.random() < celldata.deathRate)) ) {
        dyingList.push([cell[0], cell[1]]);
        data.delete(cell[0], cell[1]);
      } else if (increaseDeathRate > 0) {
        if (celldata) {
          celldata.deathRate += increaseDeathRate;
        } else {
          data.set(cell[0], cell[1], { fertilityRate: 0, deathRate: increaseDeathRate });
        }
      }
    });

    // process adjacent cells to see if they might be births
    for (r in possibleBirths) {
      for (c in possibleBirths[r]) {
        pcell = [+r, +c];
        celldata = data[+r] && data[+r][+c];
        livens = model.getCellNeighbours(pcell);

        if ( (livens === 3) ||
             ((extraBirthsRate > 0) && (Math.random() < extraBirthsRate)) ||
             (celldata && (celldata.fertilityRate > 0) && (Math.random() < celldata.fertilityRate)) ) {
          birthList.push(pcell);
          data.delete(+r, +c);
        } else if (increaseFertilityRate > 0) {
          if (celldata) {
            celldata.fertilityRate += increaseFertilityRate;
          } else {
            data.set(+r, +c, { fertilityRate: increaseFertilityRate, deathRate: 0 });
          }
        }
      }
    }

    model.setAlive(birthList, true);
    model.setAlive(dyingList, false);
  };

  that.setExtraBirthsRate = function(newvalue) {
    extraBirthsRate = newvalue;
  };
  
  that.setExtraDeathsRate = function(newvalue) {
    extraDeathsRate = newvalue;
  };
  
  that.setIncreaseFertilityRateRate = function(newvalue) {
    increaseFertilityRate = newvalue;
  };
  
  that.setIncreaseDeathRate = function(newvalue) {
    increaseDeathRate = newvalue;
  };
  
  return that;
});

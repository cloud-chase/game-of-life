
define(['app/sparse-2d-array', 'app/GoL-shapes', 'app/property-bag'], function(sparse, golshapes, propertyBag) {

  var extraBirthsRate = 0,
    extraDeathsRate = 0,
    increaseFertilityRate = 0,
    increaseDeathRate = 0,
    model = undefined,
    data = sparse.new(),
    shapes = 0,
    that = {},

    defaultShapes = function() {
      return [
        // dot
        { category: 'default', name: 'dot', width: '1', height: '1', rule: 'B3/S23', shape: 'o!'},
        // seed
        { category: 'default', name: 'seed', width: '3', height: '4', shape: 'bo$obo$obo$bo!'},
        // glider
        { category: 'default', name: 'glider', width: '3', height: '3', shape: '3o$2bo$bo!'},
        // lightweightSpaceship
        { category: 'default', name: 'lightweightSpaceship', width: '4', height: '4', shape: 'o2bo$4bo$o3bo$b4o!'},
        // acorn
        { category: 'default', name: 'acorn', width: '7', height: '3', shape: 'bo$3bo$2o2b3o!'},
        // pentadecathlon
        { category: 'default', name: 'pentadecathlon', width: '10', height: '3', shape: '2bo4bo$2ob4ob2o$2bo4bo!'},
        // pulsar
        { category: 'default', name: 'pulsar', width: '13', height: '13', shape: '2b3o3b3o$$o4bobo4bo$o4bobo4bo$o4bobo4bo$2b3o3b3o$$2b3o3b3o$o4bobo4bo$o4bobo4bo$o4bobo4bo$$2b3o3b3o!'},
        // lines
        { category: 'default', name: 'line20', width: '20', height: '1', shape: '20o!'},
        { category: 'default', name: 'line50', width: '50', height: '1', shape: '50o!'},
        { category: 'default', name: 'line100', width: '100', height: '1', shape: '100o!'}
      ];
    },

    processShapes = function() {
      // convert lif encoding to array of living cells
      shapes.forEach(function(item) {
        var lines,
          lineNo = 0,
          cells = [],
          match,
          midx = Math.floor(item.width/2),
          midy = Math.floor(item.height/2),
          regx = /([0-9]*)([ob])/g;

        lines = item.shape.split('$');
        lines.forEach(function(line) {
          var cell = [], pos = 0, len;
          while ((match = regx.exec(line)) !== null) {
            if (match[1] !== '') {
              len = parseInt(match[1]);
            } else {
              len = 1;
            }
            if (match[2] === 'o') {
              for (i = 0; i < len; i++) {
                cell.push(lineNo - midy);
                cell.push(i + pos - midx);
                cells.push(cell);
                cell = [];
              }
            }
            pos += len;
          }
          lineNo += 1;
        })
        item.cells = cells;

        item.caption = item.category + '/' + item.name;
      });
    },

    initShapes = function(maxHeight, maxWidth) {
      shapes = defaultShapes();
      shapes = shapes.concat(golshapes);
      shapes.filter(function(item) {
        return item.width <= maxWidth && item.height <= maxHeight;
      });
      processShapes();
    },

    setExtraBirthsRate = function(newvalue) {
      extraBirthsRate = parseInt(newvalue)/1000;
    },

    setExtraDeathsRate = function(newvalue) {
      extraDeathsRate = parseInt(newvalue)/1000;
    },

    setIncreaseFertilityRateRate = function(newvalue) {
      increaseFertilityRate = parseInt(newvalue)/1000;
    },

    setIncreaseDeathRate = function(newvalue) {
      increaseDeathRate = parseInt(newvalue)/1000;
    };

  that.init = function(amodel, engineCursorChanged, $propertyHost) {
    model = amodel;

    propertyBag.addTextProperty('extraBirths', 'Extra births / 1000', setExtraBirthsRate);
    propertyBag.addTextProperty('extraDeaths', 'Extra deaths / 1000', setExtraDeathsRate);
    propertyBag.addTextProperty('increaseBirths', 'Increase births / 1000', setIncreaseFertilityRateRate);
    propertyBag.addTextProperty('increaseDeaths', 'Extra births / 1000', setIncreaseDeathRate);

    // shape size limit 250 x 250 also applied in grunt build
    initShapes(250, 250);
    propertyBag.addDropdownProperty('shapes', 'Shape', shapes, function(index) {
      engineCursorChanged.fire(shapes[index]);
    });

    propertyBag.createUI($propertyHost);
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

  return that;
});

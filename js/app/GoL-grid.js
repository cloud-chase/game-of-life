define(['jquery', 'app/GoL-model', 'app/GoL-canvas-renderer', 'app/GoL-shapes', 'jquery-ui'], function($, model, divrenderer, golshapes) {

  var possibleBirths=[],
      dyingList=[],
      birthList=[],
      golStatus = {},
      extraBirthsRate = 0,
      extraDeathsRate = 0,
      increaseFertilityRate = 0,
      increaseDeathRate = 0,
      data = [],
      grid_rows = 0,
      grid_cols = 0,
      iterations = 0,

      shapes = [
        { category: 'default', name: 'dot', width: '1', height: '1', rule: 'B3/S23', shape: 'o!'},

        // glider
        { category: 'default', name: 'glider', width: '3', height: '3', shape: '3o$2bo$bo!'},

        // lightweightSpaceship
        { category: 'default', name: 'lightweightSpaceship', width: '4', height: '4', shape: 'o2bo$4bo$o3bo$b4o!'},
//        [[0,0],[0,3],[1,4],[2,0],[2,4],[3,1],[3,2],[3,3],[3,4]],

        // acorn
        { category: 'default', name: 'acorn', width: '7', height: '3', shape: 'bo$3bo$2o2b3o!'},
//        [[0,1],[1,3],[2,0],[2,1],[2,4],[2,5],[2,6]],

        // pentadecathlon
        { category: 'default', name: 'pentadecathlon', width: '4', height: '4', shape: '2bo4bo$2ob4ob2o$2bo4bo!'},
//        [[1,0],[1,1],[0,2],[2,2],[1,3],[1,4],[1,5],[1,6],[0,7],[2,7],[1,8],[1,9]],

        // pulsar
        { category: 'default', name: 'pulsar', width: '13', height: '13', shape: '2b3o3b3o$$o4bobo4bo$o4bobo4bo$o4bobo4bo$2b3o3b3o$$2b3o3b3o$o4bobo4bo$o4bobo4bo$o4bobo4bo$$2b3o3b3o!'},
        // [[0,0],[0,1],[0,2],[0,6],[0,7],[0,8],[2,-2],[2,3],[2,5],[2,10],[3,-2],[3,3],[3,5],[3,10],
        //  [4,-2],[4,3],[4,5],[4,10],[5,0],[5,1],[5,2],[5,6],[5,7],[5,8],[7,0],[7,1],[7,2],[7,6],
        //  [7,7],[7,8],[8,-2],[8,3],[8,5],[8,10],[9,-2],[9,3],[9,5],[9,10],[10,-2],[10,3],[10,5],
        //  [10,10],[12,0],[12,1],[12,2],[12,6],[12,7],[12,8]]
      ],

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
        });
      },

      initShapes = function(maxHeight, maxWidth) {
        shapes = shapes.concat(golshapes);
        shapes.filter(function(item) {
          return item.width <= maxWidth && item.height <= maxHeight;
        })
        processShapes();
      },

      checkGoLCellState = function(cell) {
        // Individual cell processor
        var n = model.getCellNeighbours(cell),// adjacent
            sum = 0, i;

        for (i in n) {
          if (n[i][2]) {
            sum += 1;
          } else if (cell[2]) {  // only consider neighbours of live cells as possible births
            (possibleBirths[n[i][0]] || (possibleBirths[n[i][0]] = []))[n[i][1]] = true;
          }
        }

        return sum;
      },

      checkGoLCellStates = function() {
        var r, c, pcell, livens;

        // process living cells to see if they might be deaths
        model.forEachLiving(function(cell) {
          celldata = data[cell[0]] && data[cell[0]][cell[1]];
          livens = checkGoLCellState(cell);

          if ( (livens < 2) ||
               (livens > 3) ||
               ((extraDeathsRate > 0) && (Math.random() < extraDeathsRate)) ||
               (celldata && (celldata.deathRate > 0) && (Math.random() < celldata.deathRate)) ) {
            dyingList.push(cell);
            if (celldata) {
              celldata.fertilityRate = 0; // reset
              celldata.deathRate = 0;
            }
          } else if (celldata && (increaseDeathRate > 0)) {
            celldata.deathRate += increaseDeathRate;
          }
        });

        // process adjacent cells to see if they might be births
        for (r in possibleBirths) {
          for (c in possibleBirths[r]) {
            pcell = [+r, +c, false];
            celldata = data[+r] && data[+r][+c];
            livens = checkGoLCellState(pcell);

            if ( (livens === 3) ||
                 ((extraBirthsRate > 0) && (Math.random() < extraBirthsRate)) ||
                 (celldata && (celldata.fertilityRate > 0) && (Math.random() < celldata.fertilityRate)) ) {
              birthList.push(pcell);
              if (celldata) {
                celldata.fertilityRate = 0; // reset
                celldata.deathRate = 0;
              }
            } else if (celldata && (increaseFertilityRate > 0)) {
              celldata.fertilityRate += increaseFertilityRate;
            }
          }
          delete possibleBirths[r];
        }

        model.setAlive(birthList, true);
        birthList.length = 0;

        model.setAlive(dyingList, false);
        dyingList.length = 0;
      },

      golStatusMgr = function() {
        var timer,
          iterationTimes,
          firstTime,
          lastTime,
          that = {},
          $timing = $("#timing-value"),
          $timingAverage = $("#timing-average"),
          $iterations = $("#iterations"),
          $lifecount = $("#life-count"),

          init = function() {
            timer = 0;
            iterationTimes = [];
            firstTime = 0;
            lastTime = 0;
            $timing.text('');
            $timingAverage.text('');
            $iterations.text('0');
            $lifecount.text('0');
          },

          tick = function() {
            var count = iterationTimes.length;
            var output;
            if (count > 0) {
              output = iterationTimes.reduce(function(a,b) { return a + b; }) / count;
              iterationTimes = [];
              $timing.text(output.toFixed(2));
            }
            $iterations.text('' + iterations);
            $lifecount.text('' + model.getNumberLiving());
            if (iterations > 0) {
              $timingAverage.text(((lastTime - firstTime) / iterations).toFixed(2));
            }
          };

        that.start = function() {
          timer = setInterval(tick, 1000); // report once per second
        };
        that.stop = function() {
          clearInterval(timer);
        };
        that.golTiming = function(t) {
          if (0 === firstTime) {
            firstTime = t;
          } else {
            iterationTimes.push(t - lastTime);
          }
          lastTime = t;
        };
        that.clear = function() {
          init();
          tick();
        };
        init();
        return that;
      },

      goLStep = function()
      {
        var d, thisTime,
          d = new Date(),
          thisTime = d.getTime(); // milliseconds since 01/01 1970

        iterations += 1;
        golStatus.golTiming(thisTime);

        checkGoLCellStates();
      },

      // Constructor
      GoLGrid = function(doc, gridHeight, gridWidth, rows, cols) {
        var r, c, callback = $.Callbacks();

        $(".GoLGrid").css({"width": gridWidth, "height": gridHeight});
        $(".GoLGrid").resizable();
        grid_rows = rows;
        grid_cols = cols;
        model.init(-1, -1, callback);
        divrenderer.init(doc, rows, cols, model);
        callback.add(divrenderer.cellChanged);

        for (r = 0; r < rows; r++) {
          data[r] = [];
          for (c = 0; c < cols; c++) {
            data[r][c] = { fertilityRate: 0, deathRate: 0 };
          }
        }

        r = Math.floor(rows / 2);
        c = Math.floor(cols / 2);
        model.setAlive([[r - 1, c], [r, c - 1], [r, c + 1], [r + 1, c]], true);
      },

      // Public functions *** follow example aMethod ***
      /*
      // Sample exported method
      GoLGrid.prototype.aMethod = function(one, two, three) {
        This add's the method 'aMethod' to the exported GoLGrid object prototype.
        It's parameters are one two and three.
      };
      */

      timerGoL = 0;

  GoLGrid.prototype.startStop = function() {
    if (timerGoL === 0) {
      extraBirthsRate = $("#extraBirthsPerThousand").val() / 1000.0;
      extraDeathsRate = $("#extraDeathsPerThoursand").val() / 1000.0;
      increaseFertilityRate = $("#increaseFertilityPerThousand").val() / 1000.0;
      increaseDeathRate = $("#increaseDeathPerThousand").val() / 1000.0;
      timerGoL = setInterval(function(){goLStep();},$("#txtInterval").val());
      $("#startStopBtn").attr('value', 'Stop');
      $("#status").text("Status: Running");
      golStatus.start();
    } else {
      clearInterval(timerGoL);
      golStatus.stop();
      timerGoL = 0;
      $("#startStopBtn").attr('value', 'Start');
      $("#status").text("Status: Stopped");
    }
  };

  GoLGrid.prototype.clear = function() {
    model.clearLiving();
    iterations = 0;
    golStatus.clear();
  };

  $(function() {
    var index = 0, $shapes = $('#shapes');

    golStatus = golStatusMgr();
    initShapes(grid_rows, grid_cols);
    shapes.forEach(function(shape) {
      $shapes.append($('<option></option>').val(index).html(shape.category + '/' + shape.name));
      index += 1;
    });
    $shapes.on('change', function(e) {
        divrenderer.setCursorShape(shapes[parseInt(this.value)].cells);
    });
  });

  return GoLGrid;
});

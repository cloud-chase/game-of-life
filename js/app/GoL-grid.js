define(['jquery', 'app/GoL-model', 'app/div-renderer', 'jquery-ui'], function($, model, divrenderer) {

  var possibleBirths=[],
      dyingList=[],
      birthList=[],
      golStatus = {},
      extraBirthsRate = 0,
      extraDeathsRate = 0,
      increaseFertilityRate = 0,
      increaseDeathRate = 0,
      data = [],
      iterations = 0,

      shapes = [
        // default
        [[0,0]],

        // glider
        [[0,0],[0,1],[0,2],[1,2],[2,1]],

        // lightweightSpaceship
        [[0,0],[0,3],[1,4],[2,0],[2,4],[3,1],[3,2],[3,3],[3,4]],

        // acorn
        [[0,0],[1,2],[2,-1],[2,0],[2,3],[2,4],[2,5]],

        // pentadecathlon
        [[0,0],[0,1],[-1,2],[1,2],[0,3],[0,4],[0,5],[0,6],[-1,7],[1,7],[0,8],[0,9]],

        // pulsar
        [[0,0],[0,1],[0,2],[0,6],[0,7],[0,8],[2,-2],[2,3],[2,5],[2,10],[3,-2],[3,3],[3,5],[3,10],
         [4,-2],[4,3],[4,5],[4,10],[5,0],[5,1],[5,2],[5,6],[5,7],[5,8],[7,0],[7,1],[7,2],[7,6],
         [7,7],[7,8],[8,-2],[8,3],[8,5],[8,10],[9,-2],[9,3],[9,5],[9,10],[10,-2],[10,3],[10,5],
         [10,10],[12,0],[12,1],[12,2],[12,6],[12,7],[12,8]]
      ],

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
          celldata = data[cell[0]][cell[1]];
          livens = checkGoLCellState(cell);
          
          if ( (livens < 2) ||
               (livens > 3) ||
               ((extraDeathsRate > 0) && (Math.random() < extraDeathsRate)) ||
               ((celldata.deathRate > 0) && (Math.random() < celldata.deathRate)) ) {
            dyingList.push(cell);
            celldata.fertilityRate = 0; // reset
            celldata.deathRate = 0;
          } else if (increaseDeathRate > 0) {
            celldata.deathRate += increaseDeathRate;
          }
        });

        // process adjacent cells to see if they might be births
        for (r in possibleBirths) {
          for (c in possibleBirths[r]) {
            pcell = [+r, +c, false];
            celldata = data[+r][+c];            
            livens = checkGoLCellState(pcell);
            
            if ( (livens === 3) ||
                 ((extraBirthsRate > 0) && (Math.random() < extraBirthsRate)) ||
                 ((celldata.fertilityRate > 0) && (Math.random() < celldata.fertilityRate)) ) {
              birthList.push(pcell);
              celldata.fertilityRate = 0; // reset
              celldata.deathRate = 0;
            } else if (increaseFertilityRate > 0) {
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
        var timer = 0,
          iterationTimes = [],
          firstTime = 0,
          lastTime = 0,
          tick = 0,
          $timing,
          $iterations,
          $lifecount,
          $timingAverage
          that = {};

        $timing = $("#timing-value");
        $timingAverage = $("#timing-average");
        $iterations = $("#iterations");
        $lifecount = $("#life-count");

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
          $timingAverage.text(((lastTime - firstTime) / iterations).toFixed(2));
        }
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

        model.init(rows, cols, callback);
        divrenderer.init(doc, rows, cols, model);
        callback.add(divrenderer.cellChanged);
        
        for (r = 0; r < rows; r++) {
          data[r] = [];
          for (c = 0; c < cols; c++) {
            data[r][c] = { fertilityRate: 0, deathRate: 0 };
          }
        }
        
        model.setAlive([[44, 80], [45, 79], [45, 81], [46, 80]], true);
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
  };

  $(function() {
    golStatus = golStatusMgr();
    $('#shape').on('change', function(e) {
        divrenderer.setCursorShape(shapes[parseInt(this.value)]);
    });
  });

  return GoLGrid;
});

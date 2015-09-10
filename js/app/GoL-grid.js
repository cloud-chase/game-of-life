define(['jquery', 'app/GoL-model', 'app/div-renderer', 'jquery-ui'], function($, model, divrenderer) {
  
  var possibleList=[],
      dyingList=[],
      birthList=[],
      golStatus = {},
      extraBirthsRate = 0,
      extraDeathsRate = 0,
      increaseFertilityRate = 0,
      increaseDeathRate = 0,
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

      checkGoLCellState = function(cell, handleSum, handleAdjacent) {
        // Individual cell processor
        var n = model.getCellNeighbours(cell),// adjacent
          sum,
          i;

        sum = 0;
        for (i = 0; i < n.length; i++) {
          if (!n[i].alive) { // always checking alive state here
            handleAdjacent(n[i]);
          } else {
            sum += 1;
          }
        }
        handleSum(sum, cell);
      },

      checkGoLCellStates = function(handleSum, handleAdjacent) {
        // process living cells
        model.forEachLiving(function(cell) {
          // select just living cells, keep processing to a minimum (efficient?)
          checkGoLCellState(cell, handleSum, handleAdjacent);
        });

        // filter duplicates
        possibleList = possibleList.filter(function(elem, pos, arr) {
          return arr.indexOf(elem) === pos;
        })
        // process adjacent **********
        possibleList.forEach(function(cell) {
          checkGoLCellState(cell,
            function(sum, cell) { // handleSum
              if ( (sum === 3) ||
                   ((extraBirthsRate > 0) && (Math.random() < extraBirthsRate)) || 
                   ((cell.data.fertilityRate > 0) && (Math.random() < cell.data.fertilityRate)) ) {
                birthList.push(cell);
                cell.data.fertilityRate = 0; // reset
                cell.data.deathRate = 0;
              } else if (increaseFertilityRate > 0) {
                cell.data.fertilityRate = (cell.data.fertilityRate || 0) + increaseFertilityRate;
              }
            }, function() { // handleAdjacents
              // do nothing. adjacent of possible not added to possible
            }
          );
        });

        possibleList.length = 0;
        
        model.setAlive(birthList, true);
        birthList.length = 0;

        model.setAlive(dyingList, false);
        dyingList.length = 0;
      },

      golStatusMgr = function() {
        var timer = 0,
          lastTime = [],
          tick = 0,
          $timing,
          $iterations,
          $lifecount,
          that = {};

        $timing = $("#timing-value");
        $iterations = $("#iterations");
        $lifecount = $("#life-count");

        tick = function() {
          var count = lastTime.length;
          var output;
          if (count > 0) {
            output = lastTime.reduce(function(a,b) { return a + b; }) / count;
            lastTime = [];
            $timing.text(output.toFixed(2));
          }
          $iterations.text(iterations.toString());
          $lifecount.text('' + model.getNumberLiving());
        }
        that.start = function() {
          timer = setInterval(tick, 1000); // report once per second
        };
        that.stop = function() {
          clearInterval(timer);
        };
        that.golTiming = function(t) {
          lastTime.push(t);
        };
        return that;
      },

      lastTime = 0,
      goLStep = function()
      {
        var d, thisTime,
          d = new Date(),
          thisTime = d.getTime(); // milliseconds since 01/01 1970

        iterations += 1;
        if (lastTime !== 0) {
          golStatus.golTiming(thisTime-lastTime);
        }
        lastTime = thisTime;

        checkGoLCellStates(
          function(sum, cell) { // handleSum
            if ( (sum < 2) ||
                 (sum > 3) ||
                 ((extraDeathsRate > 0) && (Math.random() < extraDeathsRate)) || 
                 ((cell.data.deathRate > 0) && (Math.random() < cell.data.deathRate)) ) {
              dyingList.push(cell);
              cell.data.fertilityRate = 0; // reset
              cell.data.deathRate = 0;
            } else if (increaseDeathRate > 0) {
              cell.data.deathRate = (cell.data.deathRate || 0) + increaseDeathRate;
            }
          }, function(cell) { // handleAdjacents
            possibleList.push(cell);
          }
        );
      },

      // Constructor
      GoLGrid = function(doc, gridHeight, gridWidth, rows, cols) {
        var callback = $.Callbacks();
        
        $(".GoLGrid").css({"width": gridWidth, "height": gridHeight});
        $(".GoLGrid").resizable();

        model.init(rows, cols, callback);
        divrenderer.init(doc, rows, cols, model);
        callback.add(divrenderer.cellChanged);
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

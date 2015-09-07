(function() {
  "use strict";
  var moduleMaker = function(moduleName, moduleObject) {
    // Module export function coping with Node, AMD and browser
    // Stick this function in every module
    if (typeof module !== 'undefined' && typeof module.exports !== 'undefined') {
      module.exports = moduleObject(); // NodeJS support
    } else {
      if (typeof define === 'function' && define.amd) {
        define([], function() {
          return moduleObject(); // AMD support
        });
      } else {
        window[moduleName] = moduleObject(); // browser support
      }
    }
  };
  
  
  // this is the renderer code, separated from the game function code
  // TODO: this should be moved into a separate loaded module
  var createRenderer = function(birthhandler, deathhandler) {
    
    var gridHeight = 0,
        gridWidth = 0,
        cellRefs = [],
        cursorShape = [[0,0]],
        
        makeGrid = function(doc, rows, cols) {
          gridHeight = rows;
          gridWidth = cols;
          cellRefs = [];
          
          var grid = doc.getElementById("grid1"),
              row, cell,
          
              addDivTo = function(doc, hostDiv, newDivClass, newDivID) {
                var newDiv = doc.createElement("Div");
                newDiv.className = newDivClass;
                newDiv.id = newDivID;
                hostDiv.appendChild(newDiv);
                return newDiv;
              };
              
          for (var r = 0; r < rows; r++) {
            row = addDivTo(doc, grid, "GoLRow block", "r" + r.toString());
            row.visible = true;
            cellRefs[r] = [];

            for (var c = 0; c < cols; c++) {
              cell = addDivTo(doc, row, "GoLCell block", "r" + r.toString() + "c" + c.toString());
              cell.visible = true;
              cell.setAttribute('row', r); // chose this to keep jquery in thie file to minimum
              cell.setAttribute('col', c); // javascript dom

              cellRefs[r][c] = {
                row: r,
                col: c,
                alive: false,
                div: $(cell),
                data: {}
              };
            }
          }
          
          $(".GoLRow").css({ width: "100%", height: (100 / rows) + "%" });
          $(".GoLCell").css({ width: (100 / cols) + "%", height: "100%" });
          
          var mouseDown = false,
              toggleShapeInner = function(cell, toggleClass, forceOff) {
                if (forceOff || cell.div.hasClass(toggleClass)) {
                  cell.div.removeClass(toggleClass);
                  if (toggleClass === 'alive') {
                    deathhandler(cell);
                    cell.alive = false;
                  }
                } else {
                  cell.div.addClass(toggleClass);
                  if (toggleClass === 'alive') {
                    birthhandler(cell);
                    cell.alive = true;
                  }
                }
              },
              toggleShape = function(cellDiv, shape, toggleClass, forceOff) {
                var $cellDiv = $(cellDiv),
                    r = Number($cellDiv.attr('row')),
                    c = Number($cellDiv.attr('col')),
                    cell;
                
                for (var i = 0; i < shape.length; i++) {
                  cell = getCell(r + shape[i][0], c + shape[i][1]);
                  cell && toggleShapeInner(cell, toggleClass, forceOff);
                }
              };
          
          $('.GoLCell').mousedown(function() {
            toggleShape(this, cursorShape, 'alive');
            mouseDown = true;
          });
          
          $('.GoLCell').mouseup(function() {
            mouseDown = false;
          });
          
          $('.GoLCell').mouseenter(function() {
            var r = Number($(this).attr('row')),
                c = Number($(this).attr('col'));

            $("#activeCell").text("Active Cell - Row: " + r + ", Col: " + c);
            if (mouseDown) {
              toggleShape(this, cursorShape, 'alive');
            } else {
              // shape stretches from mouse down / right
              toggleShape(this, cursorShape, 'prenatal');
            }
          });
          
          $('.GoLCell').mouseleave(function() {
            toggleShape(this, cursorShape, 'prenatal', true);
          });

        },
    
        getCell = function(row, col) {
          return cellRefs[(row % gridHeight + gridHeight) % gridHeight][(col % gridWidth + gridWidth) % gridWidth];
        },
        
        setAlive = function(cell, alive) {
          cell.alive = alive;
          alive ? cell.div.addClass('alive') : cell.div.removeClass('alive');
        },
        
        isAlive = function(cell) {
          return cell.alive;
        },
        
        getCellNeighbours = function(cell) {
          var result = cell.neighbours;
          
          if (!result) {
            var r = Number($(cell).attr('row')),
                c = Number($(cell).attr('col'));

            result = [
              getCell(r-1, c-1),
              getCell(r-1, c),
              getCell(r-1, c+1),
              getCell(r, c-1),
              getCell(r, c+1),
              getCell(r+1, c-1),
              getCell(r+1, c),
              getCell(r+1, c+1)
            ];
            
            cell.neighbours = result;
          }
          
          return result;
        },
        
        setCursorShape = function(shape) {
          cursorShape = shape;
        };
    
    return {
      makeGrid: makeGrid,
      getCell: getCell,
      setAlive: setAlive,
      isAlive: isAlive,
      getCellNeighbours: getCellNeighbours,
      setCursorShape: setCursorShape
    };
    
  };
  
  
  moduleMaker("GoLGrid", function() {
    var living=[],
        renderer = createRenderer(
          function(cell) {
            living.push(cell);
          }, function(cell) {
            living.splice(living.indexOf(cell), 1);
          }),
        possibleList=[],
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
          var n = renderer.getCellNeighbours(cell),// adjacent
            sum,
            i;

          sum = 0;
          for (i = 0; i < 8; i++) {
            if (n[i] !== undefined) {
              if (!renderer.isAlive(n[i])) { // always checking alive state here
                handleAdjacent(n[i]);
              } else {
                sum += 1;
              }
            }
          }
          handleSum(sum, cell);
        },

        checkGoLCellStates = function(handleSum, handleAdjacent) {
          // process living cells
          living.forEach(function(cell) {
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
                if (sum === 3 || Math.random() < extraBirthsRate || Math.random() < (cell.data.fertilityRate || 0) ) {
                  birthList.push(cell);
                  cell.data.fertilityRate = 0; // reset
                  cell.data.deathRate = 0;
                } else {
                  cell.data.fertilityRate = (cell.data.fertilityRate || 0) + increaseFertilityRate;
                }
              }, function() { // handleAdjacents
                // do nothing. adjacent of possible not added to possible
              }
            );
          });

          possibleList = [];

          // filter duplicate births *********
          birthList = birthList.filter(function(elem, pos, arr) {
            return arr.indexOf(elem) === pos;
          });

          birthList.forEach(function(cell) {
            living.push(cell);
            renderer.setAlive(cell, true);
          });

          birthList = [];

          // filter duplicates
          dyingList = dyingList.filter(function(elem, pos, arr) {
            return arr.indexOf(elem) === pos;
          });

          dyingList.forEach(function(cell) {
            living.splice(living.indexOf(cell), 1);
            renderer.setAlive(cell, false);
          });

          dyingList = [];
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
            $lifecount.text(living.length.toString());
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
              if ((sum < 2) || (sum > 3) || Math.random() < extraDeathsRate || Math.random() < (cell.data.deathRate || 0)) {
                dyingList.push(cell);
                cell.data.fertilityRate = 0; // reset
                cell.data.deathRate = 0;
              } else {
                cell.data.deathRate = (cell.data.deathRate || 0) + increaseDeathRate;
              }
            }, function(cell) { // handleAdjacents
              possibleList.push(cell);
            }
          );
        },

        // Constructor
        GoLGrid = function(doc, gridHeight, gridWidth, rows, cols) {
          $(".GoLGrid").css({"width": gridWidth, "height": gridHeight});
          $(".GoLGrid").resizable();

          renderer.makeGrid(doc, rows, cols);
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
      living.forEach(function(cell) {
        renderer.setAlive(cell, false);
      });
      living = [];
    };

    $(function() {
      golStatus = golStatusMgr();
      $('#shape').on('change', function(e) {
          renderer.setCursorShape(shapes[parseInt(this.value)]);
      });
    });

    return GoLGrid;
  });
  
})();

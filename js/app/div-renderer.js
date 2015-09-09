define(function() {

  // this is the renderer code, separated from the game function code
  return function(birthhandler, deathhandler) {

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
  
});

define(function() {

  // this is the renderer code, separated from the game function code
  var cursorShape = [[0,0]],
      divs = [],

      /**
        Initialise the renderer. The HTML document is supplied, and the rows
        and columns that the rendered grid should display, and a model which
        the renderer will use.
      */
      init = function(doc, rows, cols, model) {

        var grid = doc.getElementById("grid1"),
            row, cell, background_grid, background_row, background_cell, foreground_grid,
            rowH = (100 / rows) + "%",
            colW = (100 / cols) + "%";

        addDivTo = function(doc, hostDiv, newDivClass, newDivID) {
          var newDiv = doc.createElement("Div");
          newDiv.className = newDivClass;
          newDiv.id = newDivID;
          hostDiv.appendChild(newDiv);
          return newDiv;
        };

        background_grid = addDivTo(doc, grid, 'background-grid', '');
        foreground_grid = addDivTo(doc, grid, 'foreground-grid', '')

        for (var r = 0; r < rows; r++) {
          background_row = addDivTo(doc, background_grid, 'GoLRow block','');
          background_row.style.height = rowH;
          row = addDivTo(doc, foreground_grid, "GoLRow block", "r" + r.toString());
          row.visible = true;
          row.style.height = rowH;
          console.log('setting row height to: ' + rowH + ', actual=' + row.style.height);
          divs[r] = [];

          for (var c = 0; c < cols; c++) {
            background_cell = addDivTo(doc, background_row, 'GoLCell block','');
            background_cell.style.width = colW;
            cell = addDivTo(doc, row, "GoLCell block", "r" + r.toString() + "c" + c.toString());
            cell.visible = true;
            cell.setAttribute('row', r); // chose this to keep jquery in thie file to minimum
            cell.setAttribute('col', c); // javascript dom
            cell.style.width = colW;

            divs[r][c] = $(cell);
          }
        }

        var mouseDown = false,
            toggleShapeInner = function(cell, toggleClass, forceOff) {
              try {
                var div = divs[cell[0]] && divs[cell[0]][cell[1]];
                if (forceOff || div.hasClass(toggleClass)) {
                  if (toggleClass === 'alive') {
                    model.setAlive([cell], false);
                  } else if (div) {
                    div.removeClass(toggleClass);
                  }
                } else {
                  if (toggleClass === 'alive') {
                    model.setAlive([cell], true);
                  } else if (div) {
                    div.addClass(toggleClass);
                  }
                }
              } catch (e) {}
            },
            toggleShape = function(cellDiv, shape, toggleClass, forceOff) {
              var $cellDiv = $(cellDiv),
                  r = Number($cellDiv.attr('row')),
                  c = Number($cellDiv.attr('col')),
                  cell;

              for (var i in shape) {
                cell = [r + shape[i][0], c + shape[i][1]];
                model.getCell(cell);
                toggleShapeInner(cell, toggleClass, forceOff);
              }
            };

        $('.foreground-grid .GoLCell').mousedown(function() {
          toggleShape(this, cursorShape, 'alive');
          mouseDown = true;
        });

        $(document).mouseup(function() {
          mouseDown = false;
        });

        $('.foreground-grid .GoLCell').mouseenter(function() {
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

        $('.foreground-grid .GoLCell').mouseleave(function() {
          toggleShape(this, cursorShape, 'prenatal', true);
        });

        model.forEachLiving(function(cell) {
          divs[cell[0]] &&
          divs[cell[0]][cell[1]] &&
          divs[cell[0]][cell[1]].addClass('alive');
        });

      },

      /**
        Register the change of state of a cell [row, column, alive]. This
        method should be called every time the state of a cell changes, to
        enable the renderer to reflect the current state of all cells.
      */
      cellChanged = function(cell, alive) {
        divs[cell[0]] &&
        divs[cell[0]][cell[1]] &&
        divs[cell[0]][cell[1]].toggleClass('alive', alive);
      },

      /**
        Set the shape of the user interaction cursor. The shape is supplied as
        an array of cell offsets, each of which is an array of two elements
        being the row and column offsets from the starting cell of each cell
        to form part of the cursor shape.
      */
      setCursorShape = function(shape) {
        cursorShape = shape;
      };

  return {
    init: init,
    cellChanged: cellChanged,
    setCursorShape: setCursorShape,
    name: 'div-renderer'
  };

});

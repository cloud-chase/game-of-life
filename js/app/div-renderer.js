define(function() {

  // this is the renderer code, separated from the game function code
  var cursorShape = [[0,0]],

      /**
        Initialise the renderer. The HTML document is supplied, and the rows
        and columns that the rendered grid should display, and a model which
        the renderer will use.
      */
      init = function(doc, rows, cols, model) {

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

          for (var c = 0; c < cols; c++) {
            cell = addDivTo(doc, row, "GoLCell block", "r" + r.toString() + "c" + c.toString());
            cell.visible = true;
            cell.setAttribute('row', r); // chose this to keep jquery in thie file to minimum
            cell.setAttribute('col', c); // javascript dom

            model.getCell(r, c).data.div = $(cell);
          }
        }

        $(".GoLRow").css({ width: "100%", height: (100 / rows) + "%" });
        $(".GoLCell").css({ width: (100 / cols) + "%", height: "100%" });

        var mouseDown = false,
            toggleShapeInner = function(cell, toggleClass, forceOff) {
              if (forceOff || cell.data.div.hasClass(toggleClass)) {
                if (toggleClass === 'alive') {
                  model.setAlive(cell, false);
                } else {
                  cell.data.div.removeClass(toggleClass);
                }
              } else {
                if (toggleClass === 'alive') {
                  model.setAlive(cell, true);
                } else {
                  cell.data.div.addClass(toggleClass);
                }
              }
            },
            toggleShape = function(cellDiv, shape, toggleClass, forceOff) {
              var $cellDiv = $(cellDiv),
                  r = Number($cellDiv.attr('row')),
                  c = Number($cellDiv.attr('col')),
                  cell;

              for (var i = 0; i < shape.length; i++) {
                cell = model.getCell(r + shape[i][0], c + shape[i][1]);
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
      
      /**
        Register the change of state of a cell. This method should be called
        every time the state of a cell in the model changes, to enable the 
        renderer to reflect the current state of all cells in the model.
      */
      cellChanged = function(cell) {
        cell.data.div.toggleClass('alive', cell.alive);
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
    setCursorShape: setCursorShape
  };
  
});

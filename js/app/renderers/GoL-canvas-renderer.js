define(['jquery'], function($) {

  var cursorShape = [[0,0]],
      cursorCells = [],
      gridWidth, gridHeight,
      cellWidth, cellHeight,
      originX, originY,
      context,

      /**
        Initialise the renderer. The HTML document is supplied, and the rows
        and columns that the rendered grid should display, and a model which
        the renderer will use.
      */
      init = function(doc, rows, cols, model) {

        var $grid = $('#grid1'),
            canvas = doc.createElement("Canvas"),
            $canvas = $(canvas),

            redraw = function() {
              var width = $grid.width(),
                  height = $grid.height(),
                  i;

              // update and reset the canvas, in case dimensions have changed
              $canvas.attr('width', width);
              $canvas.attr('height', height);

              context.clearRect(0, 0, width, height);

              cellWidth = Math.floor(width / cols);
              cellHeight = Math.floor(height / rows);
              originX = Math.floor((width % cols) / 2);
              originY = Math.floor((height % rows) / 2);

              // draw a grid
              context.strokeStyle = '#e6e6fa';
              context.lineWidth = 1;

              for (i = 0; i <= gridWidth; i++) {
                context.moveTo(originX + (i * cellWidth) - 0.5, originY - 0.5);
                context.lineTo(originX + (i * cellWidth) - 0.5, originY + (rows * cellHeight) - 0.5);
              }

              for (i = 0; i <= gridHeight; i++) {
                context.moveTo(originX - 0.5, originY + (i * cellHeight) - 0.5);
                context.lineTo(originX + (cols * cellWidth) - 0.5, originY + (i * cellHeight) - 0.5);
              }

              context.stroke();

              // draw the cell states
              model.forEachLiving(paintCell);
            };

        $grid.append(canvas);
        context = canvas.getContext('2d');
        gridWidth = cols;
        gridHeight = rows;

        redraw();
        $(window).resize(redraw);

        var setCursor = function(event, forceoff) {
              // remove any current cursor
              cursorCells.forEach(function(cell) { paintCell(cell, model.getCell(cell) ? '#000000' : '#ffffff'); });
              cursorCells.length = 0;

              if (!forceoff) {
                // add cursor at new position
                var row = Math.floor((event.pageY - $canvas.offset().top - originY) / cellHeight),
                    column = Math.floor((event.pageX - $canvas.offset().left - originX) / cellWidth);
                if ((row > 0) && (column > 0) && (row < gridHeight) && (column < gridWidth)) {
                  $("#activeCell").text("Active Cell - Row: " + row + ", Col: " + column);
                  for (var offset of cursorShape) {
                    var cell = [row + offset[0], column + offset[1]];
                    model.getCell(cell);
                    cursorCells.push(cell);
                  }
                  drawCursor();
                } else {
                  $("#activeCell").text("Active Cell:");
                }
              } else {
                $("#activeCell").text("Active Cell:");
              }
            },

            mousedown = false;

        $('#grid1 canvas').mousedown(function(event) {
          setCursor(event);
          model.setAlive(cursorCells, true);
          drawCursor();
          mousedown = true;
        });

        $(document).mouseup(function() {
          mousedown = false;
        });

        $('#grid1 canvas').mousemove(function(event) {
          setCursor(event);
          if (mousedown) {
            model.setAlive(cursorCells, true);
            drawCursor();
          }
        });

        $('#grid1 canvas').mouseleave(function(event) {
          setCursor(event, true);
        });
      },

      paintCell = function(cell, color) {
        if ((cell[0] >= 0) && (cell[1] >= 0) && (cell[0] < gridHeight) && (cell[1] < gridWidth)) {
          context.fillStyle = color;
          context.fillRect(originX + (cell[1] * cellWidth), originY + (cell[0] * cellHeight), cellWidth - 1, cellHeight - 1);
        }
      },

      drawCursor = function() {
        cursorCells.forEach(function(cell) { paintCell(cell, '#808080'); });
      },

      /**
        Register the change of state of a cell [row, column, alive]. This
        method should be called every time the state of a cell changes, to
        enable the renderer to reflect the current state of all cells.
      */
      cellChanged = function(cell, alive) {
        paintCell(cell, alive ? '#000000' : '#ffffff');
        if (cursorCells.some(function(cursor) { return (cell[0] == cursor[0]) && (cell[1] == cursor[1]); })) {
          drawCursor();
        }
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
    name: 'GoL-canvas-renderer'
  };

});

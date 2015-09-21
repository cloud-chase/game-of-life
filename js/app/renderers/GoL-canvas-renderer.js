define(['jquery'], function($) {

  var cursorShape = [[0,0]],
      cursorCell,
      gridWidth, gridHeight,
      cellWidth, cellHeight,
      originX, originY,
      model,
      context, cursorContext,

      /**
        Initialise the renderer. The HTML document is supplied, and the rows
        and columns that the rendered grid should display, and a model which
        the renderer will use.
      */
      init = function(doc, rows, cols, amodel) {

        var $grid = $('#grid1'),
            canvas = doc.createElement("Canvas"),
            $canvas = $(canvas),
            cursorCanvas = doc.createElement("Canvas"),
            $cursorCanvas = $(cursorCanvas),

            redraw = function() {
              var width = $grid.width(),
                  height = $grid.height(),
                  i;

              // update and reset the canvas, in case dimensions have changed
              $canvas.attr('width', width).attr('height', height);
              $cursorCanvas.attr('width', width).attr('height', height);

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
              model.forEachLiving(function(cell) { paintCell(context, cell, '#000000'); });
              
              drawCursor();
            };

        $grid.append(canvas);
        $grid.append(cursorCanvas);
        $cursorCanvas.css({ position: 'absolute', left: '0', right: '0' });
        context = canvas.getContext('2d');
        cursorContext = cursorCanvas.getContext('2d');
        gridWidth = cols;
        gridHeight = rows;
        model = amodel;

        redraw();
        $(window).resize(redraw);

        var setCursor = function(event) {
              // update cursor position
              var row = Math.floor((event.pageY - $canvas.offset().top - originY) / cellHeight),
                  column = Math.floor((event.pageX - $canvas.offset().left - originX) / cellWidth),
                  result = true;
          
              if ((row < 0) || (column < 0) || (row >= gridHeight) || (column >= gridWidth)) {
                cursorCell = undefined;
                $("#activeCell").text("Active Cell:");
                drawCursor();
              } else if (!cursorCell || (row != cursorCell[0]) || (column != cursorCell[1])) {
                cursorCell = [row, column];
                $("#activeCell").text("Active Cell - Row: " + row + ", Col: " + column);
                drawCursor();
              } else {
                result = false;
              }
          
              return result;
            },
            
            applyCursor = function() {
              // apply current cursor to model
              if (cursorCell) {
                var on = [], off = [];
                for (var offset of cursorShape) {
                  var cell = [cursorCell[0] + offset[0], cursorCell[1] + offset[1]],
                      alive = model.getCell(cell);
                  (alive ? off : on).push(cell);
                }

                model.setAlive(on, true);
                model.setAlive(off, false);
              }
            },

            mousedown = false;

        $('#grid1 canvas').mousedown(function(event) {
          setCursor(event);
          applyCursor();
          mousedown = true;
        });

        $(document).mouseup(function() {
          mousedown = false;
        });

        $('#grid1 canvas').mousemove(function(event) {
          if (setCursor(event) && mousedown) {
            applyCursor();
          }
        });

        $('#grid1 canvas').mouseleave(function(event) {
          if (cursorCell) {
            // remove any current cursor and set the cursor off
            cursorCell = undefined;
            $("#activeCell").text("Active Cell:");
            drawCursor();
          }
        });
      },

      paintCell = function(drawcontext, cell, color) {
        if ((cell[0] >= 0) && (cell[1] >= 0) && (cell[0] < gridHeight) && (cell[1] < gridWidth)) {
          drawcontext.fillStyle = color;
          drawcontext.fillRect(originX + (cell[1] * cellWidth), originY + (cell[0] * cellHeight), cellWidth - 1, cellHeight - 1);
        }
      },
      
      drawCursor = function() {
        // draw/redraw/remove any current cursor
        cursorContext.clearRect(originX, originY, gridWidth * cellWidth, gridHeight * cellHeight);
        if (cursorCell) {
          for (var offset of cursorShape) {
            var cell = [cursorCell[0] + offset[0], cursorCell[1] + offset[1]];
            model.getCell(cell);
            paintCell(cursorContext, cell, '#8080ff');
          }
        }
      },

      /**
        Register the change of state of a cell [row, column, alive]. This
        method should be called every time the state of a cell changes, to
        enable the renderer to reflect the current state of all cells.
      */
      cellChanged = function(cell, alive) {
        paintCell(context, cell, alive ? '#000000' : '#ffffff');
      },

      /**
        Set the shape of the user interaction cursor. The shape is supplied as
        an array of cell offsets, each of which is an array of two elements
        being the row and column offsets from the starting cell of each cell
        to form part of the cursor shape.
      */
      setCursorShape = function(shape) {
        cursorShape = shape;
        drawCursor();
      };

  return {
    init: init,
    cellChanged: cellChanged,
    setCursorShape: setCursorShape,
    name: 'GoL-canvas-renderer'
  };

});

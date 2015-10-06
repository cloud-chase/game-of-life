define(['jquery'], function($) {

  var cursorShape = [[0,0]], cursorCell,
      gridLineWidth, cellSize,
      width, height,
      scrollX, scrollY,
      nodes = [],
      model, context, cursorContext,
      gridColor = '#e6e6fa',
      aliveColor = ['#202066', '#aa2200', '#447722', '#5511aa', '#99aa22', '#22aa99', '#994477'],
      cursorColor = '#8080ff',

      // returns a color to use for the supplied cell value
      statecolor = function(value) {
        return value ? aliveColor[(typeof value === 'number') ? ((value - 1) % aliveColor.length) : 0] : null;
      },

      paintCell = function(drawcontext, cell, color) {
        // calculate the area to draw in canvas coordinates
        var x = (cell[1] * cellSize) - scrollX,
            y = (cell[0] * cellSize) - scrollY,
            w = cellSize,
            h = cellSize;

        // if the cell isn't in the canvas area there's nothing to do
        if ((x + w > 0) && (y + h > 0) && (x < width) && (y < height)) {

          // exclude the grid line from the area to draw
          x += ((Math.ceil(gridLineWidth) % 2) / 2) + (gridLineWidth / 2);
          y += ((Math.ceil(gridLineWidth) % 2) / 2) + (gridLineWidth / 2);
          w -= gridLineWidth;
          h -= gridLineWidth;

          // first and last row/col might be partial
          if (x < 0) {
            w += x;
            x = 0;
          } else if (x + w > width) {
            w = width - x;
          }

          if (y < 0) {
            h += y;
            y = 0;
          } else if (y + h > height) {
            h = height - y;
          }

          // draw or clear the area
          if (color) {
            drawcontext.fillStyle = color;
            drawcontext.fillRect(x, y, w, h);
          } else {
            drawcontext.clearRect(x, y, w, h);
          }
        }
      },

      drawCursor = function() {
        if (cursorContext) {
          // remove any current cursor
          cursorContext.clearRect(0, 0, width, height);

          // paint new cursor cells on the cursor context
          if (cursorCell) {
            for (var offset of cursorShape) {
              var cell = [cursorCell[0] + offset[0], cursorCell[1] + offset[1]];
              model.getCell(cell);
              paintCell(cursorContext, cell, cursorColor);
            }
          }
        }
      },

      redraw = function() {
        var step;

        // clear the context and draw a grid
        context.clearRect(0, 0, width, height);

        if (gridLineWidth > 0) {
          context.beginPath();
          context.strokeStyle = gridColor;
          context.lineWidth = gridLineWidth;

          // draw vertical grid lines
          step = ((((-scrollX) % cellSize) - cellSize) % cellSize) + ((Math.ceil(gridLineWidth) % 2) / 2);

          for (; step + (gridLineWidth / 2) < 0; step += cellSize) {}

          for (; step - (gridLineWidth / 2) < width; step += cellSize) {
            context.moveTo(step, 0);
            context.lineTo(step, height);
          }

          // draw horizontal grid lines
          step = ((((-scrollY) % cellSize) - cellSize) % cellSize) + ((Math.ceil(gridLineWidth) % 2) / 2);

          for (; step + (gridLineWidth / 2) < 0; step += cellSize) {}

          for (; step - (gridLineWidth / 2) < height; step += cellSize) {
            context.moveTo(0, step);
            context.lineTo(width, step);
          }

          context.stroke();
        }

        // draw the cell states
        model.forEachLiving(function(cell, state) { paintCell(context, cell, statecolor(state)); });

        // draw the cursor
        drawCursor();
      };

      /**
        Initialise the renderer. The HTML document is supplied, and the rows
        and columns that the rendered grid should display, and a model which
        the renderer will use.
      */
      init = function(doc, inCellSize, amodel, $grid) {
        var canvas = doc.createElement("Canvas"),
            $canvas = $(canvas),
            cursorCanvas = doc.createElement("Canvas"),
            $cursorCanvas = $(cursorCanvas),

            setSize = function() {
              width = $grid.width();
              height = $grid.height();
              $canvas.attr('width', width).attr('height', height);
              $cursorCanvas.attr('width', width).attr('height', height);
              redraw();
            },

            setCursor = function(event) {
              // update cursor position
              var o = $canvas.offset(),
                  x = event.pageX - o.left,
                  y = event.pageY - o.top,
                  row = Math.floor((scrollY + y) / cellSize),
                  col = Math.floor((scrollX + x) / cellSize),
                  result = true;

              if ((x < 0) || (y < 0) || (x >= width) || (y >= height)) {
                cursorCell = undefined;
                $("#activeCell").text("Active Cell:");
                drawCursor();
              } else if (!cursorCell || (row != cursorCell[0]) || (col != cursorCell[1])) {
                cursorCell = [row, col];
                $("#activeCell").text("Active Cell - Row: " + row + ", Col: " + col);
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

            mousedown = false,
            mousedownX, mousedownY, mousedownScrollX, mousedownScrollY, mousemoving;

        cellSize = inCellSize;
        gridLineWidth = (cellSize > 1) ? 1 : 0;
        scrollX = 0;
        scrollY = 0;
        $grid.append(canvas).append(cursorCanvas);
        nodes.push(canvas, cursorCanvas);
        $cursorCanvas.css({ position: 'absolute', left: '0', right: '0' });
        context = canvas.getContext('2d');
        cursorContext = cursorCanvas.getContext('2d');
        model = amodel;

        setSize();
        $(window).resize(setSize);

        $('#grid1 canvas').mousedown(function(event) {
          setCursor(event);
          mousedown = true;
          mousedownX = event.pageX;
          mousedownY = event.pageY;
          mousedownScrollX = scrollX;
          mousedownScrollY = scrollY;
          mousemoving = false;
        });

        $(document).mouseup(function(event) {
          setCursor(event);
          if (mousedown && !mousemoving) {
            applyCursor();
          }
          mousedown = false;
        });

        $('#grid1 canvas').mousemove(function(event) {
          if (mousedown) {
            if (Math.abs(event.pageX - mousedownX) + Math.abs(event.pageY - mousedownY) > 3) {
              mousemoving = true;
            }

            if (mousemoving) {
              if (cursorCell) {
                cursorCell = undefined;
                drawCursor();
              }

              scrollX = mousedownScrollX - event.pageX + mousedownX;
              scrollY = mousedownScrollY - event.pageY + mousedownY;
              redraw();
            } else {
              setCursor(event);
            }
          } else {
            setCursor(event);
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

      /**
        Reset the renderer, removing any DOM constructs that were created.
      */
      clear = function() {
        for (var node of nodes) {
          node.parentNode.removeChild(node);
        }
        nodes.length = 0;
        model = context = cursorContext = undefined;
      },

      /**
        Register the change of state of a cell [row, column, alive]. This
        method should be called every time the state of a cell changes, to
        enable the renderer to reflect the current state of all cells.
      */
      cellChanged = function(cell, state) {
        paintCell(context, cell, statecolor(state));
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
    clear: clear,
    cellChanged: cellChanged,
    setCursorShape: setCursorShape,
    name: 'GoL-canvas-renderer'
  };

});

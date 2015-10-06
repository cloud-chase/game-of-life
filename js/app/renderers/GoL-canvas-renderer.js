define(['jquery'], function($) {

  var cursorShape = [[0,0]],
      cursorCell,
      cellSize,
      firstRow, firstCol, lastRow, lastCol,
      firstRowInset, firstColInset, lastRowInset, lastColInset,
      nodes = [],
      model, context, cursorContext,
      gridColor = '#e6e6fa',
      aliveColor = ['#202066', '#aa2200', '#447722', '#5511aa', '#99aa22', '#22aa99', '#994477'],
      cursorColor = '#8080ff',
      gridLineWidth = 1,

      statecolor = function(value) {
        return value ? aliveColor[(typeof value === 'number') ? ((value - 1) % aliveColor.length) : 0] : null;
      },

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
            scrollX = 0, scrollY = 0,

            redraw = function() {
              var width = $grid.width(),
                  height = $grid.height(),
                  rows = 1 + Math.floor(height / cellSize),
                  cols = 1 + Math.floor(width / cellSize),
                  step, start, end;

              // update and reset the canvas, in case dimensions have changed
              $canvas.attr('width', width).attr('height', height);
              $cursorCanvas.attr('width', width).attr('height', height);

              context.clearRect(0, 0, width, height);

              firstRow = Math.floor(scrollY / cellSize);
              firstCol = Math.floor(scrollX / cellSize);
              lastRow = firstRow + rows;
              lastCol = firstCol + cols;
              firstRowInset = ((scrollY % cellSize) + cellSize) % cellSize;
              firstColInset = ((scrollX % cellSize) + cellSize) % cellSize;
              lastRowInset = (rows * cellSize) - height - firstRowInset;
              lastColInset = (cols * cellSize) - width - firstColInset;

              // draw a grid
              context.strokeStyle = gridColor;
              context.lineWidth = gridLineWidth;

              step = - firstColInset + ((gridLineWidth % 2) / 2);
              start = 0;
              end = height;

              if (step >= 0) {
                context.moveTo(step, start);
                context.lineTo(step, end);
              }

              for (i = firstCol + 1, step += cellSize; i <= lastCol - 1; i++, step += cellSize) {
                context.moveTo(step, start);
                context.lineTo(step, end);
              }
              
              if (step < width) {
                context.moveTo(step, start);
                context.lineTo(step, end);
              }

              step = - firstRowInset + ((gridLineWidth % 2) / 2);
              start = 0;
              end = width;

              if (step >= 0) {
                context.moveTo(start, step);
                context.lineTo(end, step);
              }

              for (i = firstRow + 1, step += cellSize; i <= lastRow - 1; i++, step += cellSize) {
                context.moveTo(start, step);
                context.lineTo(end, step);
              }

              if (step < height) {
                context.moveTo(start, step);
                context.lineTo(end, step);
              }
              
              context.stroke();

              // draw the cell states
              model.forEachLiving(function(cell, state) { paintCell(context, cell, statecolor(state)); });

              // draw the cursor
              drawCursor();
            };

        cellSize = inCellSize;
        $grid.append(canvas);
        $grid.append(cursorCanvas);
        nodes.push(canvas);
        nodes.push(cursorCanvas);
        $cursorCanvas.css({ position: 'absolute', left: '0', right: '0' });
        context = canvas.getContext('2d');
        cursorContext = cursorCanvas.getContext('2d');
        model = amodel;

        redraw();
        $(window).resize(redraw);

        var setCursor = function(event) {
              // update cursor position
              var o = $canvas.offset(),
                  row = firstRow + Math.floor((event.pageY - o.top + firstRowInset) / cellSize),
                  column = firstCol + Math.floor((event.pageX - o.left + firstColInset) / cellSize),
                  result = true;

              if ((row < firstRow) || (column < firstCol) || (row > lastRow) || (column > lastCol)) {
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

            mousedown = false,
            mousedownX, mousedownY, mousedownScrollX, mousedownScrollY, mousemoving;

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

      paintCell = function(drawcontext, cell, color) {
        if ((cell[0] >= firstRow) && (cell[1] >= firstCol) && (cell[0] <= lastRow) && (cell[1] <= lastCol)) {
          var grid = ((gridLineWidth + (gridLineWidth % 2)) / 2),
              x = ((cell[1] - firstCol) * cellSize) - firstColInset + grid,
              y = ((cell[0] - firstRow) * cellSize) - firstRowInset + grid,
              w = cellSize - gridLineWidth,
              h = cellSize - gridLineWidth;

          if (+cell[0] === firstRow) {
            y += firstRowInset - gridLineWidth;
            h -= firstRowInset - gridLineWidth;
          } else if (+cell[0] === lastRow) {
            h -= lastRowInset;
          }

          if (+cell[1] === firstCol) {
            x += firstColInset - gridLineWidth;
            w -= firstColInset - gridLineWidth;
          } else if (+cell[1] === lastCol) {
            w -= lastColInset;
          }

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
          // draw/redraw/remove any current cursor
          cursorContext.clearRect(0, 0,
                                  ((lastCol - firstCol) * cellSize) + gridLineWidth,
                                  ((lastRow - firstRow) * cellSize) + gridLineWidth);
          if (cursorCell) {
            for (var offset of cursorShape) {
              var cell = [cursorCell[0] + offset[0], cursorCell[1] + offset[1]];
              model.getCell(cell);
              paintCell(cursorContext, cell, cursorColor);
            }
          }
        }
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

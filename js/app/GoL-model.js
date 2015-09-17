define(function() {

  /**
    This provides a model for Conway's Game of Life, storing the state of a
    grid of cells in a reasonably efficient way and providing various methods
    to query the states, modify the states, and be notified of changes to the
    states of cells in the grid.

    To minimise object overhead, this model represents and works with cells as
    arrays of three elements, being the row number, column number, and status
    of the cell (true=alive, false=dead). The total set of currently living
    cells is held in a sparse 2D array.
  */

  var gridHeight = 0,
      gridWidth = 0,
      living = {},
      callback = undefined,

      /**
        Add cells to the living set. Each cells must be an array containing
        the row and column as the first two elements.
      */
      addLiving = function(cells) {
        var row, cell;
        for (cell of cells) {
          // normalise row and column indices and check if currently dead
          if (!getCell(cell)) {
            row = living[cell[0]];
            if (!row) {
              row = living[cell[0]] = {};
              // include a non-enumerable 'count' property to keep track of entries
              Object.defineProperty(row, 'count', { writable: true, value: 1 });
            } else {
              row.count++;
            }
            row[cell[1]] = true;
            callback.fire(cell, true);
          }
        }
      },

      /**
        Remove cells from the living set. Each cell must be an array
        containing the row and column as the first two elements.
      */
      removeLiving = function(cells) {
        for (var cell of cells) {
          // normalise row and column indices and check if currently alive
          if (getCell(cell)) {
            delete living[cell[0]][cell[1]];
            if (--living[cell[0]].count === 0) {
              delete living[cell[0]];
            }
            callback.fire(cell, false);
          }
        }
      },

      /**
        Initialise the model. The number of rows and columns are supplied,
        along with a 'callback' object which must have a 'fire' method on it
        which will be called every time a cell changes state with the cell
        [row, column] and alive state (true or false) being passed as
        arguments. If the number of rows is -1, the grid is infinitely high.
        If the number of columns is -1, the grid is infinitely wide.
      */
      init = function(rows, cols, cellcallback) {
        gridHeight = rows;
        gridWidth = cols;
        living = {};
        callback = cellcallback;
      },

      /**
        Update a cell [row, column], ensuring the row and column are normalised
        for any wrapping that is being applied, and return the current state.
      */
      getCell = function(cell) {
        if (gridHeight >= 0) {
          cell[0] = (cell[0] % gridHeight + gridHeight) % gridHeight;
        }

        if (gridWidth >= 0) {
          cell[1] = (cell[1] % gridWidth + gridWidth) % gridWidth;
        }

        return living[cell[0]] && living[cell[0]][cell[1]];
      },

      /**
        Call the specified handler function once for each cell that is
        currently living, with the cell [row, column] being passed as
        the only argument. The cells are supplied in no significant order.
      */
      forEachLiving = function(handler) {
        var r, c, cell = [];
        for (r in living) {
          cell[0] = r;
          for (c in living[r]) {
            cell[1] = c;
            handler(cell);
          }
        }
      },

      /**
        Return the number of cells currently living.
      */
      getNumberLiving = function() {
        var r, result = 0;
        for (r in living) {
          result += living[r].count;
        }
        return result;
      },

      /**
        Return all cells to the not living state.
      */
      clearLiving = function() {
        var cells = [];
        forEachLiving(function(cell) { cells.push([cell[0], cell[1]]); });
        removeLiving(cells);
      },

      /**
        Set the state of all cells in an array, which must each be an array
        [row, column, any-value] (the third element of each will be set to
        match the alive parameter during the call) to living or not living.
      */
      setAlive = function(cells, alive) {
        alive ? addLiving(cells) : removeLiving(cells);
      },

      /**
        Return the number of the neighbours of a cell currently living. If a
        handler function is provided it is called once for each neighbour of
        the cell that is not currently living.
      */
      getCellNeighbours = function(cell, handler) {
        var result = 0,
            handle = function() {
              if (getCell(cell)) {
                result++;
              } else if (handler) {
                handler(cell);
              }
            };
        
        cell[0]--; handle();
        cell[1]--; handle();
        cell[0]++; handle();
        cell[0]++; handle();
        cell[1]++; handle();
        cell[1]++; handle();
        cell[0]--; handle();
        cell[0]--; handle();
        cell[1]--; cell[0]++;
        
        return result;
      };

  return {
    init: init,
    getCell: getCell,
    forEachLiving: forEachLiving,
    getNumberLiving: getNumberLiving,
    clearLiving: clearLiving,
    setAlive: setAlive,
    getCellNeighbours: getCellNeighbours
  };

});

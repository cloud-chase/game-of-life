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
      living = [],
      callback = undefined,

      /**
        Add cells to the living set. The cells must be arrays of three
        elements, containing the row and column as the first two elements.
        The third element of each cell will be set to true during this method.
      */
      addLiving = function(cells) {
        var row, cell;
        for (cell of cells) {
          // normalise row and column indices and get current state
          getCell(cell);

          // if the cell is not already alive, add it to the set and notify
          if (!cell[2]) {
            row = living[cell[0]];
            if (!row) {
              row = living[cell[0]] = [];
              // include a non-enumerable 'count' property to keep track of entries
              Object.defineProperty(row, 'count', { writable: true, value: 1 });
            } else {
              row.count++;
            }
            cell[2] = row[cell[1]] = true;
            callback.fire(cell);
          }
        }
      },

      /**
        Remove cells from the living set. The cells must be arrays of three
        elements, containing the row and column as the first two elements.
        The third element of each cell will be set to false during this method.
      */
      removeLiving = function(cells) {
        for (var cell of cells) {
          // normalise row and column indices and get current state
          getCell(cell);

          // if the cell is currently alive, remove it from the set and notify
          if (cell[2]) {
            delete living[cell[0]][cell[1]];
            if (--living[cell[0]].count === 0) {
              delete living[cell[0]];
            }
            cell[2] = false;
            callback.fire(cell);
          }
        }
      },

      /**
        Initialise the model. The number of rows and columns are supplied,
        along with a 'callback' object which must have a 'fire' method on it
        which will be called every time a cell changes state with the cell
        [row, column, alive] being passed as the only argument. If the number
        of rows is -1, the grid is infinitely high. If the number of columns
        is -1, the grid is infinitely wide.
      */
      init = function(rows, cols, cellcallback) {
        gridHeight = rows;
        gridWidth = cols;
        living.length = 0;
        callback = cellcallback;
      },

      /**
        Update a cell [row, column, alive], ensuring the row and column are
        normalised for any wrapping that is being applied, and setting the
        third element to the the current living state.
      */
      getCell = function(cell) {
        if (gridHeight >= 0) {
          cell[0] = (cell[0] % gridHeight + gridHeight) % gridHeight;
        }

        if (gridWidth >= 0) {
          cell[1] = (cell[1] % gridWidth + gridWidth) % gridWidth;
        }

        cell[2] = living[cell[0]] && living[cell[0]][cell[1]];
        return cell;
      },

      /**
        Call the specified handler function once for each cell that is
        currently living, with the cell [row, column, alive] being passed as
        the only argument. The cells are supplied in no significant order.
      */
      forEachLiving = function(handler) {
        var r, c;
        for (r in living) {
          for (c in living[r]) {
            handler([+r, +c, true]);
          }
        }
      },

      /**
        Return the number of cells currently living.
      */
      getNumberLiving = function() {
        var r, c, result = 0;
        for (r in living) {
          for (c in living[r]) {
            result++;
          }
        }
        return result;
      },

      /**
        Return all cells to the not living state.
      */
      clearLiving = function() {
        var cells = [];
        forEachLiving(function(cell) { cells.push(cell); });
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
        Return all the neighbours of a cell in an array.
      */
      getCellNeighbours = function(cell) {
        return [
          getCell([cell[0] - 1, cell[1] - 1, false]),
          getCell([cell[0] - 1, cell[1], false]),
          getCell([cell[0] - 1, cell[1] + 1, false]),
          getCell([cell[0], cell[1] - 1, false]),
          getCell([cell[0], cell[1] + 1, false]),
          getCell([cell[0] + 1, cell[1] - 1, false]),
          getCell([cell[0] + 1, cell[1], false]),
          getCell([cell[0] + 1, cell[1] + 1, false])
        ];
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

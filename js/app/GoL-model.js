define(['app/sparse-2d-array'], function(sparse) {

  /**
    This provides a model for simple state cellular automata, including though
    not limited to Conway's Game of Life. The model stores the state of a grid
    of cells in a reasonably economic way and providing various methods to
    query the states, modify the states, and be notified of changes to the
    states of cells in the grid.
  */

  var gridHeight = 0,
      gridWidth = 0,
      living = undefined,
      callback = undefined,

      /**
        Add cells to the living set. Each cells must be an array containing
        the row and column as the first two elements.
      */
      addLiving = function(cells, value) {
        var row, cell;
        for (cell of cells) {
          // normalise row and column indices and check if currently dead
          if (!getCell(cell)) {
            living.set(cell[0], cell[1], value);
            callback.fire(cell, value);
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
            living.delete(cell[0], cell[1]);
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
        living = sparse.new();
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
        the first argument and its state as the second argument. The
        cells are not supplied in a guaranteed order.
      */
      forEachLiving = function(handler) {
        var r, c, cell = [];
        for (r in living) {
          cell[0] = r;
          for (c in living[r]) {
            cell[1] = c;
            handler(cell, living[r][c]);
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
        Any falsy value denotes not living, and any other value becomes the
        new state of the cells.
      */
      setAlive = function(cells, state) {
        state ? addLiving(cells, state) : removeLiving(cells);
      },

      /**
        Return the number of the neighbours of a cell currently living. If a
        handler function is provided it is called once for each neighbour of
        the cell, with the cell [row, column] being passed as the first
        argument and its state as the second argument.
      */
      getCellNeighbours = function(cell, handler) {
        var result = 0,
            handle = function() {
              var state = getCell(cell);
              state && result++;
              handler && handler(cell);
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

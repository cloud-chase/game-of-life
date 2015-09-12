define(function() {

  var gridHeight = 0,
      gridWidth = 0,
      living = [],
      callback = undefined,
      
      addLiving = function(cells) {
        for (var i in cells) {
          getCell(cells[i]);
          if (!cells[i][2]) {
            cells[i][2] = (living[cells[i][0]] || (living[cells[i][0]] = []))[cells[i][1]] = true;
            callback.fire(cells[i]);
          }
        }
      },

      removeLiving = function(cells) {
        for (var i in cells) {
          getCell(cells[i]);
          if (cells[i][2]) {
            delete living[cells[i][0]][cells[i][1]];
            if (living[cells[i][0]].length === 0) {
              delete living[cells[i][0]];
            }
            cells[i][2] = false;
            callback.fire(cells[i]);
          }
        }
      },
      
      /**
        Initialise the model. The number of rows and columns are supplied,
        along with a 'callback' object which must have a 'fire' method on it
        which will be called every time a cell changes state with the cell
        [row, column, alive] being passed as the only argument.
      */
      init = function(rows, cols, cellcallback) {
        gridHeight = rows;
        gridWidth = cols;
        living = [];
        callback = cellcallback;
      },

      /**
        Update a cell [row, column, alive], ensuring the row and column are
        normalised for any wrapping that is being applied, and setting the 
        third element to the the current living state.
      */
      getCell = function(cell) {
        cell[0] = (cell[0] % gridHeight + gridHeight) % gridHeight;
        cell[1] = (cell[1] % gridWidth + gridWidth) % gridWidth;
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

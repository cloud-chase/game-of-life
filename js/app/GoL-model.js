define(function() {

  var gridHeight = 0,
      gridWidth = 0,
      cellRefs = [],
      living = [],
      callback = undefined,

      addLiving = function(cell) {
        if (cell.length !== undefined) {
          cell.forEach(addLiving);
        } else if (!cell.alive) {
          living.push(cell);
          cell.alive = true;
          callback.fire(cell);
        }
      },

      removeLiving = function(cell) {
        if (cell.length !== undefined) {
          cell.forEach(removeLiving);
        } else if (cell.alive) {
          living.splice(living.indexOf(cell), 1);
          cell.alive = false;
          callback.fire(cell);
        }
      }, 

      /**
        Initialise the model. The number of rows and columns are supplied,
        along with a 'callback' object which must have a 'fire' method on it
        which will be called every time a cell changes state with the cell
        being passed as the only argument.
      */
      init = function(rows, cols, cellcallback) {
        gridHeight = rows;
        gridWidth = cols;
        cellRefs = [];
        living = [];
        callback = cellcallback;
      },

      /**
        Get the cell object at the specified row/column position in the grid.
        The cell object contains fields 'row', 'column' and 'alive', containing
        the row and column positions of the cell and true/false according to
        the current living state of the cell. These fields should not be
        modified by the client, and no other fields in the object should be
        modified or accessed by the client except for the field 'data' which
        all cells have, which is initially an empty object, and which is
        entirely for the client's own use.
      */
      getCell = function(row, col) {
        var r = (row % gridHeight + gridHeight) % gridHeight,
            c = (col % gridWidth + gridWidth) % gridWidth;
        
        if (!cellRefs[r]) {
          cellRefs[r] = [];
        }
        
        if (!cellRefs[r][c]) {
          cellRefs[r][c] = {
            row: r,
            col: c,
            alive: false,
            data: {}
          };
        }
        
        return cellRefs[r][c];
      },
      
      /**
        Call the specified handler function once for each cell that is
        currently living, with the cell being passed as the only argument.
        The cells are supplied in no significant order.
      */
      forEachLiving = function(handler) {
        living.forEach(handler);
      },
      
      /**
        Return the number of cells currently living.
      */
      getNumberLiving = function() {
        return living.length;
      },
      
      /**
        Return all cells to the not living state.
      */
      clearLiving = function() {
        while (living.length > 0) {
          removeLiving(living[0]);
        }
      },

      /**
        Set the state of a cell to living or not living, or the states of
        all cells in an array to living or not living.
      */
      setAlive = function(cell, alive) {
        alive ? addLiving(cell) : removeLiving(cell);
      },

      /**
        Return all the neighbours of a cell in an array.
      */
      getCellNeighbours = function(cell) {
        var result = cell.neighbours;

        if (!result) {
          var r = Number($(cell).attr('row')),
              c = Number($(cell).attr('col'));

          result = [
            getCell(r-1, c-1),
            getCell(r-1, c),
            getCell(r-1, c+1),
            getCell(r, c-1),
            getCell(r, c+1),
            getCell(r+1, c-1),
            getCell(r+1, c),
            getCell(r+1, c+1)
          ];

          cell.neighbours = result;
        }

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

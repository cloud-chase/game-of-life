define(['jquery', 'app/GoL-model', 'app/GoL-shapes', 'app/renderers/renderers', 'app/engines/engines', 'jquery-ui'], function($, model, golshapes, renderers, engines) {

  var golStatus = {},
      grid_rows = 0,
      grid_cols = 0,
      iterations = 0,
      renderer = 0,
      engine = 0,
      the_doc = 0,
      callback = 0,
      interval = 0,
      nextstep = 0,
      nextyield = 0,

      shapes = [
        { category: 'default', name: 'dot', width: '1', height: '1', rule: 'B3/S23', shape: 'o!'},

        // seed
        { category: 'default', name: 'seed', width: '3', height: '4', shape: 'bo$obo$obo$bo!'},

        // glider
        { category: 'default', name: 'glider', width: '3', height: '3', shape: '3o$2bo$bo!'},

        // lightweightSpaceship
        { category: 'default', name: 'lightweightSpaceship', width: '4', height: '4', shape: 'o2bo$4bo$o3bo$b4o!'},
//        [[0,0],[0,3],[1,4],[2,0],[2,4],[3,1],[3,2],[3,3],[3,4]],

        // acorn
        { category: 'default', name: 'acorn', width: '7', height: '3', shape: 'bo$3bo$2o2b3o!'},
//        [[0,1],[1,3],[2,0],[2,1],[2,4],[2,5],[2,6]],

        // pentadecathlon
        { category: 'default', name: 'pentadecathlon', width: '10', height: '3', shape: '2bo4bo$2ob4ob2o$2bo4bo!'},
//        [[1,0],[1,1],[0,2],[2,2],[1,3],[1,4],[1,5],[1,6],[0,7],[2,7],[1,8],[1,9]],

        // pulsar
        { category: 'default', name: 'pulsar', width: '13', height: '13', shape: '2b3o3b3o$$o4bobo4bo$o4bobo4bo$o4bobo4bo$2b3o3b3o$$2b3o3b3o$o4bobo4bo$o4bobo4bo$o4bobo4bo$$2b3o3b3o!'},
        // [[0,0],[0,1],[0,2],[0,6],[0,7],[0,8],[2,-2],[2,3],[2,5],[2,10],[3,-2],[3,3],[3,5],[3,10],
        //  [4,-2],[4,3],[4,5],[4,10],[5,0],[5,1],[5,2],[5,6],[5,7],[5,8],[7,0],[7,1],[7,2],[7,6],
        //  [7,7],[7,8],[8,-2],[8,3],[8,5],[8,10],[9,-2],[9,3],[9,5],[9,10],[10,-2],[10,3],[10,5],
        //  [10,10],[12,0],[12,1],[12,2],[12,6],[12,7],[12,8]]

        // lines
        { category: 'default', name: 'line20', width: '20', height: '1', shape: '20o!'},
        { category: 'default', name: 'line50', width: '50', height: '1', shape: '50o!'},
        { category: 'default', name: 'line100', width: '100', height: '1', shape: '100o!'}
      ],

      processShapes = function() {
        // convert lif encoding to array of living cells
        shapes.forEach(function(item) {
          var lines,
            lineNo = 0,
            cells = [],
            match,
            midx = Math.floor(item.width/2),
            midy = Math.floor(item.height/2),
            regx = /([0-9]*)([ob])/g;

          lines = item.shape.split('$');
          lines.forEach(function(line) {
            var cell = [], pos = 0, len;
            while ((match = regx.exec(line)) !== null) {
              if (match[1] !== '') {
                len = parseInt(match[1]);
              } else {
                len = 1;
              }
              if (match[2] === 'o') {
                for (i = 0; i < len; i++) {
                  cell.push(lineNo - midy);
                  cell.push(i + pos - midx);
                  cells.push(cell);
                  cell = [];
                }
              }
              pos += len;
            }
            lineNo += 1;
          })
          item.cells = cells;
        });
      },

      initShapes = function(maxHeight, maxWidth) {
        shapes = shapes.concat(golshapes);
        shapes.filter(function(item) {
          return item.width <= maxWidth && item.height <= maxHeight;
        })
        processShapes();
      },

      golStatusMgr = function() {
        var timer,
          iterationTimes,
          firstTime,
          lastTime,
          that = {},
          $timing = $("#timing-value"),
          $timingAverage = $("#timing-average"),
          $iterations = $("#iterations"),
          $lifecount = $("#life-count"),

          init = function() {
            timer = 0;
            iterationTimes = [];
            firstTime = 0;
            lastTime = 0;
            $timing.text('');
            $timingAverage.text('');
            $iterations.text('0');
            $lifecount.text('0');
          },

          tick = function() {
            var count = iterationTimes.length;
            var output;
            if (count > 0) {
              output = iterationTimes.reduce(function(a,b) { return a + b; }) / count;
              iterationTimes = [];
              $timing.text(output.toFixed(2));
            }
            $iterations.text('' + iterations);
            $lifecount.text('' + model.getNumberLiving());
            if (iterations > 0) {
              $timingAverage.text(((lastTime - firstTime) / iterations).toFixed(2));
            }
          };

        that.start = function() {
          timer = setInterval(tick, 1000); // report once per second
        };
        that.stop = function() {
          clearInterval(timer);
        };
        that.golTiming = function(t) {
          if (0 === firstTime) {
            firstTime = t;
          } else {
            iterationTimes.push(t - lastTime);
          }
          lastTime = t;
        };
        that.clear = function() {
          init();
          tick();
        };
        init();
        return that;
      },

      goLStep = function()
      {
        var _golStep = function() {
          var now;

          if (interval) {
            now = new Date().getTime();

            if (now > nextyield) {
              // we yield every 100ms for politeness, cancelling any backlog
              nextstep = now;
              nextyield = nextstep + 100;
              setTimeout(goLStep, 1);
            } else if (now < nextstep) {
              // we've some time to wait, so take a nap
              nextyield = nextstep + 100;
              setTimeout(goLStep, nextstep - now);
            } else {
              // our next step is already due (or overdue) so press on
              iterations++;
              nextstep += interval;
              golStatus.golTiming(now);
              engine && engine.stepForward && engine.stepForward();

              return _golStep;
            }
          }
        };
        var res = _golStep;
        while (res) {
          res = _golStep();
        }
      },

      // Constructor
      GoLGrid = function(doc, gridHeight, gridWidth, rows, cols) {
        var rendererInfo = renderers.getDefault(),
            engineInfo = engines.getDefault();

        the_doc = doc;
        grid_rows = rows;
        grid_cols = cols;

        callback = $.Callbacks();
        callback.add(function(cell, alive) {
          renderer && renderer.cellChanged && renderer.cellChanged(cell, alive);
        });

        model.init(-1, -1, callback);

        require([rendererInfo.file], function(r) {
          renderer = r;
          renderer.init(the_doc, grid_rows, grid_cols, model);
        });

        require([engineInfo.file], function(e) {
          engine = e;
          engine.init(model);
        });

        $(".GoLGrid").css({"width": gridWidth, "height": gridHeight});
        $(".GoLGrid").resizable();
      };

  GoLGrid.prototype.startStop = function() {
    if (renderer === 0) {
      alert('no quite ready yet');
    } else {
      if (!interval) {
        engine && engine.setExtraBirthsRate && engine.setExtraBirthsRate($("#extraBirthsPerThousand").val() / 1000.0);
        engine && engine.setExtraDeathsRate && engine.setExtraDeathsRate($("#extraDeathsPerThoursand").val() / 1000.0);
        engine && engine.setIncreaseFertilityRate && engine.setIncreaseFertilityRate($("#increaseFertilityPerThousand").val() / 1000.0);
        engine && engine.setIncreaseDeathRate && engine.setIncreaseDeathRate($("#increaseDeathPerThousand").val() / 1000.0);

        $("#startStopBtn").attr('value', 'Stop');
        $("#status").text("Status: Running");

        interval = +$("#txtInterval").val();
        nextstep = new Date().getTime();
        nextyield = nextstep + 100;
        golStatus.start();
        goLStep();
      } else {
        interval = 0;
        golStatus.stop();

        $("#startStopBtn").attr('value', 'Start');
        $("#status").text("Status: Stopped");
      }
    }
  };

  GoLGrid.prototype.clear = function() {
    model.clearLiving();
    iterations = 0;
    golStatus.clear();
  };

  $(function() {
    var index = 0, $shapes = $('#shapes'), $renderers = $('#renderers');

    golStatus = golStatusMgr();
    initShapes(grid_rows, grid_cols);
    shapes.forEach(function(shape) {
      $shapes.append($('<option></option>').val(index).html(shape.category + '/' + shape.name));
      index += 1;
    });
    $shapes.on('change', function(e) {
        renderer.setCursorShape(shapes[parseInt(this.value)].cells);
    });
    renderers.list().forEach(function(r) {
      var selected = '';
      if (r.default) {
        selected = 'selected="true"';
      }
      $renderers.append($('<option ' + selected + '></option>').val(r.file).html(r.name));
    });
    $renderers.on('change', function(e) {
      $("#grid1").empty();
      require([this.value], function(r) {
        renderer = r;
        renderer.init(the_doc, grid_rows, grid_cols, model);
        renderer.setCursorShape(shapes[parseInt($('#shapes').val())].cells);
      });
    });

    $(document).keyup(function(event) {
      var $opt = $('#shapes option:selected');
      var $newOpt;

      switch (event.keyCode) {
        case 38: // up
          $newOpt = $opt.prev();
          break;
        case 40: // down
          $newOpt = $opt.next();
          break;
        default:
          $newOpt = undefined;
      }
      if ($newOpt && $newOpt.is('option')) {
        $newOpt.prop('selected', true);
        renderer.setCursorShape(shapes[parseInt($newOpt.val())].cells);
      }
    });
  });

  return GoLGrid;
});

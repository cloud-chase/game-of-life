define(['jquery', 'app/GoL-model', 'app/renderers/renderers', 'app/engines/engines', 'jquery-ui'],
  function($, model, renderers, engines, propBagUI) {

  var golStatus = {},
      grid_rows = 0,
      grid_cols = 0,
      iterations = 0,
      renderer = 0,
      engine = 0,
      the_doc = 0,
      cellChangedCallback = 0,
      cursorChangedCallback = 0,
      cursosrShape = 0,
      interval = 0,
      nextstep = 0,
      nextyield = 0,

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
              $timing.text(output.toFixed(3));
            }
            $iterations.text('' + iterations);
            $lifecount.text('' + model.getNumberLiving());
            if (iterations > 0) {
              $timingAverage.text(((lastTime - firstTime) / iterations).toFixed(3));
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

      setEngine = function(engineInfo) {

      },

      // Constructor
      GoLGrid = function(doc, gridHeight, gridWidth, rows, cols) {
        var rendererInfo = renderers.getDefault(),
            engineInfo = engines.getDefault();

        the_doc = doc;
        grid_rows = rows;
        grid_cols = cols;

        cellChangedCallback = $.Callbacks();
        cellChangedCallback.add(function(cell, alive) {
          renderer && renderer.cellChanged && renderer.cellChanged(cell, alive);
        });
        
        cursorChangedCallback = $.Callbacks();
        cursorChangedCallback.add(function(shape) {
          cursosrShape = shape;
          renderer.setCursorShape(shape.cells);
        });        

        model.init(-1, -1, cellChangedCallback);

        require([rendererInfo.file], function(r) {
          renderer = r;
          renderer.init(the_doc, grid_rows, grid_cols, model);
        });

        require([engineInfo.file], function(e) {
          engine = e;
          engine.init(model, cursorChangedCallback, $(".model-properties"));
        });

        $(".GoLGrid").css({"width": gridWidth, "height": gridHeight});
        $(".GoLGrid").resizable();
      };

  GoLGrid.prototype.startStop = function() {
    if (renderer === 0) {
      alert('no quite ready yet');
    } else {
      if (!interval) {
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
    var index = 0,
      $renderers = $('#renderers'),
      $engines = $('#engines');

    golStatus = golStatusMgr();
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
        renderer.setCursorShape(cursorShape.cells);
      });
    });

    engines.list().forEach(function(e) {
      var selected = '';
      if (e.default) {
        selected = 'selected="true"';
      }
      $engines.append($('<option ' + selected + '></option>').val(e.file).html(e.name));
    });
    $engines.on('change', function(e) {
      GoLGrid.prototype.clear();
      engine.clear();

      require([this.value], function(e) {
        engineCursorChanged = $.Callbacks();
        engineCursorChanged.add(function(shape) {
          cursosrShape = shape;
          renderer.setCursorShape(shape.cells);
        });

        engine = e;
        engine.init(model, engineCursorChanged, $(".model-properties"));
      });
    });
  });

  return GoLGrid;
});

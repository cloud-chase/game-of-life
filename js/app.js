requirejs.config({
  // by default load modules from js/lib
  baseUrl: 'js/lib',
  // except, if module ID starts with "app", load from the js/app directory
  paths: {
    'app': '../app',
    'jquery': 'jquery/dist/jquery.min',
    'jquery-ui': 'jquery-ui/jquery-ui.min'
  }
});

var g;
requirejs(['app/GoL-grid'], function(grid) {
  g = new grid(document, "80%", "100%", 3);
});

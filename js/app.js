requirejs.config({
  // by default load modules from js/lib
  baseUrl: 'js/lib',
  // except, if module ID starts with "app", load from the js/app directory
  paths: {
    'app': '../app',
    'jquery': 'https://ajax.googleapis.com/ajax/libs/jquery/1.10.2/jquery.min',
    'jquery-ui': 'https://ajax.googleapis.com/ajax/libs/jqueryui/1.10.3/jquery-ui'
  }
});

var g;
requirejs(['app/GoL-grid'], function(grid) {
  g = new grid(document, "90%", "80%", 391, 283 );	// Prefer and odd number of lines so there is a middle
});

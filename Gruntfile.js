module.exports = function(grunt) {

  var //js_dependencies = 'js/**/*.js',
      //js_to_minify = [ 'js/app/*.js', 'js/*.js' ],
      //js_minified = 'js/app.min.js',

      sass_dependencies = 'css/**/*.scss',
      sass_to_compile = 'css/GoL.scss',
      sass_compiled = 'css/GoL.css',
      lif_shapes_folder = 'shapes/jslife/',
      lif_shapes_to_compile = lif_shapes_folder + '**/*.lif',
      lif_shapes_compiled = 'js/app/GoL-shapes.js',

  parseLif = function(filedata) {
    var lineRegx = /^[^#](.*)$/gm;
    var lifSegRegx = /([0-9]*)([bo])/g;
    var x = 0,
      y = 0,
      rule = 0,
      header,
      headparts,
      val,
      shape = '';

    while ((match = lineRegx.exec(filedata)) !== null) {
      // first line should contain header
      if (x === 0) {
        header = match[0].split(',');
        for (i = 0; i < header.length; i++) {
          headparts = header[i].split('=');
          switch(headparts[0].trim().toLowerCase()) {
            case 'x':
              x = parseInt(headparts[1]);
              break;
            case 'y':
              y = parseInt(headparts[1]);
              break;
            case 'rule':
              rule = headparts[1].trim();
              break;
          }
        }
      } else {
        shape += match[0];
      }
    }

    return {
      width: x,
      height: y,
      rule: rule,
      shape: shape
    };
  },

  parseLifs = function() {
    var parsedShapes = [],
      compiled = this.data.dest,
      toCompile = this.filesSrc;

    toCompile.forEach(function(filepath) {
      var filename, foldername, filedata, temp, shape;

      temp = filepath.substring(lif_shapes_folder.length).split('/');
      foldername = temp[0];
      filename = temp[1];
      filedata = grunt.file.read(filepath);
      shape = parseLif(filedata);

      if (shape.width < 250 && shape.height < 250) {
        shape.name = filename;
        shape.category = foldername;
        parsedShapes.push(shape);
      }
    });

    if (grunt.file.exists(compiled)) {
      grunt.file.delete(compiled);
    }
    grunt.file.write(compiled, '/* GENERATED FILE */define( function() { return' + JSON.stringify(parsedShapes) + '; });');
  };

  grunt.initConfig({

    // make our package meta-data available as fields in 'pkg'
    pkg: grunt.file.readJSON('package.json'),

    sass: {
      build: {
        src: sass_to_compile,
        dest: sass_compiled
      }
    },

    /*uglify: {
      options: {
        banner: '/' + '*! <%= pkg.name %> <%= grunt.template.today("yyyy-mm-dd") %> *' + '/\n'
      },

      custom: {
        src: js_to_minify,
        dest: js_minified
      }
    },*/

    shapes: {
      build: {
        src: lif_shapes_to_compile,
        dest: lif_shapes_compiled
      }
    },

    watch: {
      sass_build: {
        files: sass_dependencies,
        tasks: 'sass:build'
      },

      /*js_build: {
        files: js_dependencies,
        tasks: 'uglify:custom'
      }*/
    }
  });

  // Load the plugins
  grunt.loadNpmTasks('grunt-contrib-sass');
  //grunt.loadNpmTasks('grunt-contrib-uglify');
  grunt.loadNpmTasks('grunt-contrib-watch');

  // Define tasks
  grunt.registerMultiTask('shapes', parseLifs);

  grunt.registerTask('build', [ 'sass:build'/*, 'uglify'*/, 'shapes:build' ]);
  grunt.registerTask('test', [ ]);

  grunt.registerTask('default', [ 'build', 'watch' ]);
};

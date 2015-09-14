module.exports = function(grunt) {

  var //js_dependencies = 'js/**/*.js',
      //js_to_minify = [ 'js/app/*.js', 'js/*.js' ],
      //js_minified = 'js/app.min.js',

      sass_dependencies = 'css/**/*.scss',
      sass_to_compile = 'css/GoL.scss',
      sass_compiled = 'css/GoL.css';

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

  parseLif = function(filedata, catagory, name) {
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
      catagory: catagory,
      name: name,
      width: x,
      height: y,
      rule: rule,
      shape: shape
    };
  },

  parsedShapes = [],
  parseLifs = function(abspath, rootdir, subdir, filename) {
    var ext = filename.substring(filename.length - 3).toLowerCase();
    if (ext === 'lif') {
      parsedShapes.push(parseLif(grunt.file.read(abspath), subdir, filename.substring(1, filename.length - 4)));
    }
  };
  if (grunt.file.exists('shapes.json')) {
    grunt.file.delete('shapes.json');
  }
  grunt.file.recurse('shapes/jslife', parseLifs);
  grunt.file.write('shapes.json', JSON.stringify(parsedShapes));

  // Load the plugins
  grunt.loadNpmTasks('grunt-contrib-sass');
  //grunt.loadNpmTasks('grunt-contrib-uglify');
  grunt.loadNpmTasks('grunt-contrib-watch');

  // Define multi tasks
  grunt.registerTask('build', [ 'sass:build'/*, 'uglify'*/ ]);
  grunt.registerTask('test', [ ]);

  grunt.registerTask('default', [ 'build', 'watch' ]);
};

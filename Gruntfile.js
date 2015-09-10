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

  // Load the plugins
  grunt.loadNpmTasks('grunt-contrib-sass');
  //grunt.loadNpmTasks('grunt-contrib-uglify');
  grunt.loadNpmTasks('grunt-contrib-watch');

  // Define multi tasks
  grunt.registerTask('build', [ 'sass:build'/*, 'uglify'*/ ]);
  grunt.registerTask('test', [ ]);

  grunt.registerTask('default', [ 'watch' ]);
};

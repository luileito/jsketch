module.exports = function(grunt) {

  grunt.initConfig({

    pkg: grunt.file.readJSON('package.json'),

    concat: {
      full: {
        src: [
          'jsketch.js',
          'jquery.sketchable.js',
          'jquery.sketchable.memento.js',
        ],
        dest: 'dist/jquery.sketchable.full.js'
      }
    },

    uglify: {
      jsketch: {
        files: {
          'dist/jsketch.min.js': [ 'jsketch.js' ]
        }
      },
      sketchable: {
        files: {
          'dist/jquery.sketchable.min.js': [ 'jquery.sketchable.js' ]
        }
      },
      memento: {
        files: {
          'dist/jquery.sketchable.memento.min.js': [ 'jquery.sketchable.memento.js' ]
        }
      },
      full: {
        options: {
          banner: '/*! <%= pkg.description %> (all in one) | v<%= pkg.version %> | <%= grunt.template.today("yyyy-mm-dd") %> */\n'
        },
        files: {
          'dist/jquery.sketchable.full.min.js': [ '<%= concat.full.dest %>' ]
        }
      }
    },

    clean: {
      js: [
        'dist/*.js', '!dist/*.min.js'
      ]
    },

  });

  grunt.loadNpmTasks('grunt-contrib-uglify');
  grunt.loadNpmTasks('grunt-contrib-concat');
  grunt.loadNpmTasks('grunt-contrib-clean');

  grunt.registerTask('full',        [ 'concat:full', 'uglify:full', 'clean' ]);
  grunt.registerTask('jsketch',     [ 'uglify:jsketch', 'clean' ]);
  grunt.registerTask('sketchable',  [ 'uglify:sketchable', 'clean' ]);
  grunt.registerTask('memento',     [ 'uglify:memento', 'clean' ]);
  grunt.registerTask('default',     [ 'concat:full', 'uglify:full', 'uglify:jsketch', 'uglify:sketchable', 'uglify:memento', 'clean' ]);
};

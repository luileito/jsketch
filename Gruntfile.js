module.exports = function(grunt) {

  grunt.initConfig({

    pkg: grunt.file.readJSON('package.json'),

    concat: {
      all: {
        src: [
          'jsketch.js',
          'jquery.sketchable.js',
          'jquery.sketchable.memento.js',
        ],
        dest: 'dist/jsketch.all.js'
      }
    },

    uglify: {
      jsketch: {
        files: {
          'dist/jsketch.min.js': [ 'jsketch.js' ]
        }
      },
      jsketchable: {
        files: {
          'dist/jquery.jsketchable.min.js': [ 'jquery.sketchable.js' ]
        }
      },
      memento: {
        files: {
          'dist/jquery.jsketchable.memento.min.js': [ 'jquery.sketchable.memento.js' ]
        }
      },
      all: {
        options: {
          banner: '/*! <%= pkg.description %> (all in one) | v<%= pkg.version %> | <%= grunt.template.today("yyyy-mm-dd") %> */\n'
        },
        files: {
          'dist/jsketch.all.min.js': [ '<%= concat.all.dest %>' ]
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

  grunt.registerTask('all',         [ 'concat:all', 'uglify:all', 'clean' ]);
  grunt.registerTask('jsketch',     [ 'uglify:jsketch', 'clean' ]);
  grunt.registerTask('jsketchable', [ 'uglify:jsketchable', 'clean' ]);
  grunt.registerTask('memento',     [ 'uglify:memento', 'clean' ]);
  grunt.registerTask('default',     [ 'concat:all', 'uglify:all', 'uglify:jsketch', 'uglify:jsketchable', 'uglify:memento', 'clean' ]);
};

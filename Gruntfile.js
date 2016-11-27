module.exports = function(grunt) {

  grunt.initConfig({

    pkg: grunt.file.readJSON('package.json'),

    concat: {
      full: {
        src: [
          'jsketch.js',
          'sketchable.utils.js',
          'sketchable.js',
          'sketchable.memento.js',
        ],
        dest: 'dist/sketchable.full.js'
      },
      jqFull: {
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
          'dist/sketchable.min.js': [ 'sketchable.js' ]
        }
      },
      memento: {
        files: {
          'dist/sketchable.memento.min.js': [ 'sketchable.memento.js' ]
        }
      },
      full: {
        options: {
          banner: '/*! <%= pkg.description %> (all in one) | v<%= pkg.version %> | <%= grunt.template.today("yyyy-mm-dd") %> */\n'
        },
        files: {
          'dist/sketchable.full.min.js': [ '<%= concat.full.dest %>' ]
        }
      },
      jqSketchable: {
        files: {
          'dist/jquery.sketchable.min.js': [ 'jquery.sketchable.js' ]
        }
      },
      jqMemento: {
        files: {
          'dist/jquery.sketchable.memento.min.js': [ 'jquery.sketchable.memento.js' ]
        }
      },
      jqFull: {
        options: {
          banner: '/*! <%= pkg.description %> (all in one) | v<%= pkg.version %> | <%= grunt.template.today("yyyy-mm-dd") %> */\n'
        },
        files: {
          'dist/jquery.sketchable.full.min.js': [ '<%= concat.jqFull.dest %>' ]
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

  grunt.registerTask('full',        [ 'concat:full', 'uglify:full', 'concat:jqFull', 'uglify:jqFull', 'clean' ]);
  grunt.registerTask('jsketch',     [ 'uglify:jsketch', 'clean' ]);
  grunt.registerTask('sketchable',  [ 'uglify:sketchable', 'uglify:jqSketchable', 'clean' ]);
  grunt.registerTask('memento',     [ 'uglify:memento', 'uglify:jqMemento', 'clean' ]);

  grunt.registerTask('default',     [
                                      'concat:full', 'uglify:full', 'concat:jqFull', 'uglify:jqFull',
                                      'uglify:jsketch',
                                      'uglify:sketchable', 'uglify:jqSketchable',
                                      'uglify:memento', 'uglify:jqMemento',
                                      'clean'
                                    ]);
};

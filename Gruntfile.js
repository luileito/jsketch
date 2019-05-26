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
          'sketchable.animate.js',
          'sketchable.serializer.js',
          'sketchable.svg.js',
        ],
        dest: 'dist/sketchable.full.js'
      },
      jqFull: {
        src: [
          'jsketch.js',
          'jquery.sketchable.js',
          'jquery.sketchable.memento.js',
          'jquery.sketchable.animate.js',
          'jquery.sketchable.serializer.js',
          'jquery.sketchable.svg.js',
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
      animate: {
        files: {
          'dist/sketchable.animate.min.js': [ 'sketchable.animate.js' ]
        }
      },
      serializer: {
        files: {
          'dist/sketchable.serializer.min.js': [ 'sketchable.serializer.js' ]
        }
      },
      svg: {
        files: {
          'dist/sketchable.svg.min.js': [ 'sketchable.svg.js' ]
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
      jqAnimate: {
        files: {
          'dist/jquery.sketchable.animate.min.js': [ 'jquery.sketchable.animate.js' ]
        }
      },
      jqSerializer: {
        files: {
          'dist/jquery.sketchable.serializer.min.js': [ 'jquery.sketchable.serializer.js' ]
        }
      },
      jqSvg: {
        files: {
          'dist/jquery.sketchable.svg.min.js': [ 'jquery.sketchable.svg.js' ]
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
  grunt.registerTask('animate',     [ 'uglify:animate', 'uglify:jqAnimate', 'clean' ]);
  grunt.registerTask('serializer',  [ 'uglify:serializer', 'uglify:jqSerializer', 'clean' ]);
  grunt.registerTask('svg',         [ 'uglify:svg', 'uglify:jqSvg', 'clean' ]);

  grunt.registerTask('default',     [ 'full', 'jsketch', 'sketchable', 'memento', 'animate', 'serializer', 'svg' ]);
};

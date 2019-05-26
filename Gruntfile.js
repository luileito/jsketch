module.exports = function(grunt) {

  grunt.initConfig({

    pkg: grunt.file.readJSON('package.json'),

    concat: {
      full: {
        src: [
          'src/jsketch.js',
          'src/sketchable.utils.js',
          'src/sketchable.js',
          'src/sketchable.memento.js',
          'src/sketchable.animate.js',
          'src/sketchable.serializer.js',
          'src/sketchable.svg.js',
        ],
        dest: 'dist/sketchable.full.js'
      },
      jqFull: {
        src: [
          'src/jsketch.js',
          'src/jquery.sketchable.js',
          'src/jquery.sketchable.memento.js',
          'src/jquery.sketchable.animate.js',
          'src/jquery.sketchable.serializer.js',
          'src/jquery.sketchable.svg.js',
        ],
        dest: 'dist/jquery.sketchable.full.js'
      }
    },

    uglify: {
      jsketch: {
        files: {
          'dist/jsketch.min.js': [ 'src/jsketch.js' ]
        }
      },
      sketchable: {
        files: {
          'dist/sketchable.min.js': [ 'src/sketchable.js' ]
        }
      },
      memento: {
        files: {
          'dist/sketchable.memento.min.js': [ 'src/sketchable.memento.js' ]
        }
      },
      animate: {
        files: {
          'dist/sketchable.animate.min.js': [ 'src/sketchable.animate.js' ]
        }
      },
      serializer: {
        files: {
          'dist/sketchable.serializer.min.js': [ 'src/sketchable.serializer.js' ]
        }
      },
      svg: {
        files: {
          'dist/sketchable.svg.min.js': [ 'src/sketchable.svg.js' ]
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
          'dist/jquery.sketchable.min.js': [ 'src/jquery.sketchable.js' ]
        }
      },
      jqMemento: {
        files: {
          'dist/jquery.sketchable.memento.min.js': [ 'src/jquery.sketchable.memento.js' ]
        }
      },
      jqAnimate: {
        files: {
          'dist/jquery.sketchable.animate.min.js': [ 'src/jquery.sketchable.animate.js' ]
        }
      },
      jqSerializer: {
        files: {
          'dist/jquery.sketchable.serializer.min.js': [ 'src/jquery.sketchable.serializer.js' ]
        }
      },
      jqSvg: {
        files: {
          'dist/jquery.sketchable.svg.min.js': [ 'src/jquery.sketchable.svg.js' ]
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

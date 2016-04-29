module.exports = function(grunt) {

  // Project configuration.
  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),
    options: {
      banner: '/*! <%= pkg.name %> <%= grunt.template.today("yyyy-mm-dd") %> */\n'
    },
    run: {
      babel: {
        exec: 'node node_modules/babel-cli/bin/babel --presets es2015 -d lib --watch src'
      }
    },

    jasmine_nodejs: {
      // task specific (default) options
      options: {
        specNameSuffix: 'spec.js', // also accepts an array
        helperNameSuffix: 'helper.js',
        useHelpers: true,
        stopOnFailure: false,
        reporters: {
          console: {
            colors: true,
            cleanStack: 1,       // (0|false)|(1|true)|2|3
            verbosity: 4,        // (0|false)|1|2|3|(4|true)
            listStyle: 'indent', // "flat"|"indent"
            activity: false
          }
        }
      },
      dev: {
        // target specific options
        options: {
          useHelpers: true
        },
        specs: [
          'spec/**'
        ],
        helpers: [
          'spec/helpers/**'
        ]
      },
      ci: {
        // target specific options
        options: {
          useHelpers: true,
          reporters: {
            junit: {
              savePath: './reports',
              filePrefix: 'junit-report',
              consolidate: true,
              useDotNotation: true
            }
          }
        },
        specs: [
          'spec/**'
        ],
        helpers: [
          'spec/helpers/**'
        ]
      }
    }
  });

  // Load the plugin that provides the "run" task.
  grunt.loadNpmTasks('grunt-run');
  grunt.loadNpmTasks('grunt-jasmine-nodejs');

  // Default task(s).
  //grunt.registerTask('default', ['run:babel']);
};

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
      },
      tests: {
        exec: 'node node_modules/jasmine-es6/bin/jasmine.js'
      }
    },
  });

  // Load the plugin that provides the "run" task.
  grunt.loadNpmTasks('grunt-run');

  // Default task(s).
  //grunt.registerTask('default', ['run:babel']);
};

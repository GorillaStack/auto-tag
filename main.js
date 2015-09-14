var autotag = require('./lib/autotag.js');
var sampleData = require('./sample_data.js');

autotag.handler(sampleData, {
  succeed: function() {
    console.log(JSON.stringify(arguments));
    console.log('success');
    return true;
  },

  fail: function(err) {
    console.log(err);
    console.log(err.stack);
    console.log('failure');
    return false;
  }
});

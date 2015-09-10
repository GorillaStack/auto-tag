var sut = require('../lib/autotag.js');

describe('AutoTag', function() {
  var applicationContext = {
    succeed: function() {},
    fail: function() {}
  };

  it('should run without error with application context', function() {
    var fn = function() {
      sut.handler({}, applicationContext);
    };

    expect(fn).not.toThrow();
  });

  it('should throw error without application context', function() {
    var fn = function() {
      sut.handler({});
    };

    expect(fn).toThrow();
  });
});

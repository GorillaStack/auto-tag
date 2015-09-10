'use strict';

Object.defineProperty(exports, '__esModule', {
  value: true
});
var AwsCloudTrailListener = require('./aws_cloud_trail_listener');
var _exports = {};
_exports.handler = function (cloudtrailEvent, context) {
  var listener = new AwsCloudTrailListener(cloudtrailEvent, context);
  return listener.execute().then(function () {
    return true;
  }, function (err) {
    throw err;
  });

  // context.succeed();  // Echo back the first key value
  // context.fail('Something went wrong');
};

exports['default'] = _exports;
module.exports = exports['default'];
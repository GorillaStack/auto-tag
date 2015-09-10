console.log('starting autotag');

exports.handler = function(event, context) {
  //console.log('Received event:', JSON.stringify(event, null, 2));
  console.log(event);
  console.log(event.userIdentity);
  console.log(event.requestParameters);

  //console.log(context);
  context.succeed(event.key1);  // Echo back the first key value
  // context.fail('Something went wrong');
};

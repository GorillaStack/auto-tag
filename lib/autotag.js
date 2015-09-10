exports.handler = function(cloudtrailEvent, context) {
  console.log(JSON.stringify(cloudtrailEvent));
  var events = cloudtrailEvent.Records || [];

  for (var i = 0; i < events.length; i++) {
    var event = events[i];
    console.log('Event Name: ' + event.eventName);
    console.log('Event Type: ' + event.eventType);
    console.log('Event Source: ' + event.eventSource);
    console.log('AWS Region: ' + event.awsRegion);
    console.log('User Identity:');
    console.log(event.userIdentity);
    console.log('Request Parameters:');
    console.log(event.requestParameters);
    console.log('Response Elements:');
    console.log(event.requestParameters);
    console.log('s3:');
    console.log(event.s3);
  }

  context.succeed();  // Echo back the first key value
  // context.fail('Something went wrong');
};

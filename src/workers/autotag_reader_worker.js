const fs = require('fs');
//var aws_data = require('../support/aws_data_model');

// See how to use as 'require'
var AWSData = function (appName, Role, financial_identifier, owner_email, application_asset_insight_id){
    this.appName = appName;
    this.Role = Role;
    this.financial_identifier = financial_identifier;
    this.owner_email = owner_email;
    this.application_asset_insight_id = application_asset_insight_id;

    this.toJson = function (){
        return ("{" +
            "\"appName\":\"" + this.appName + "\"," +
            "\"Role\":\"" + this.Role + "\"," +
            "\"financial_identifier\":\"" + this.financial_identifier + "\"," +
            "\"owner_email\":" + this.owner_email + "," +
            "\"application_asset_insight_id\":" + this.application_asset_insight_id +
        "}");
    };
};

AWSData.fromJson = function (json){
    return new AWSData(json.appName, json.Role, json.financial_identifier, json.owner_email, json.application_asset_insight_id);
};

// Define JSON File
var data_file = '../support/consumer_aws.json';

const readFile = new Promise(function (resolve, reject) {
	fs.readFile(data_file, function(err, data) {
	    if (err)
	        reject(err);
	    else
	        resolve(data);
	    })
})

readFile.then((result) => {
	console.log('reading the file')
    var jsonObject = JSON.parse(result); 

    for(var i = 0; i < jsonObject.length; i++) {
  		var item = AWSData.fromJson(jsonObject[i]);
  		//Print the new AWSData
  		console.log(item);
     }
})
.catch(err => {
  console.error("Error in to read the file. See the details:\n " + err);
});
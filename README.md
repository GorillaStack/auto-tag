# Auto Tag

This is an open-source tagging solution for AWS.  Deploy auto tag to lambda and set up CloudTrail and have each of your resources tagged with the resource who created it.  It was written by [GorillaStack](http://www.gorillastack.com/).

[Read a blog post about the project](http://blog.gorillastack.com/gorillastack-presents-auto-tag).

1. Turn on CloudTrail.
2. Create a new Amazon S3 bucket for storing your log files, or specify an existing bucket where you want the log files delivered.
3. (Optional and NOT REQUIRED for auto tag) Create a new Amazon SNS topic in order to receive notifications when new log files are delivered.

More [documentation on creating a Trail](https://docs.aws.amazon.com/awscloudtrail/latest/userguide/cloudtrail-create-and-update-a-trail.html)

### 2. Create a lambda function

1. Within lambda, press the 'Create a Lambda Function' button
2. Press the 'Skip' button to bypass the suggested blueprints
3. Enter the lambda function name (e.g. 'autotag')
4. Select 'Node.js' as the Runtime
5. Upload the [latest release's zip file](https://github.com/GorillaStack/auto-tag/releases)
6. Under 'Handler' add 'autotag.handler'

More [documentation on Lambda](https://docs.aws.amazon.com/lambda/latest/dg/getting-started.html)

### 3. Configure the access policy for your lambda role

For the complete role's policy, scroll down for the master policy.  Read on for finer details on the access permissions required below.

### 1. Turn on CloudTrail for your region

1. Turn on CloudTrail.
2. Create a new Amazon S3 bucket for storing your log files, or specify an existing bucket where you want the log files delivered.
3. (Optional and NOT REQUIRED for auto tag) Create a new Amazon SNS topic in order to receive notifications when new log files are delivered.

More [documentation on creating a Trail](https://docs.aws.amazon.com/awscloudtrail/latest/userguide/cloudtrail-create-and-update-a-trail.html)

### 2. Create a lambda function

1. Within lambda, press the 'Create a Lambda Function' button
2. Press the 'Skip' button to bypass the suggested blueprints
3. Enter the lambda function name (e.g. 'autotag')
4. Select 'Node.js' as the Runtime
5. Upload the [latest release's zip file](https://github.com/GorillaStack/auto-tag/releases)
6. Under 'Handler' add 'autotag.handler'
7. Under 'Advanced settings' set the Timeout to 30s

More [documentation on Lambda](https://docs.aws.amazon.com/lambda/latest/dg/getting-started.html)

### 3. Configure the access policy for your lambda role

Your lambda function will run as an IAM role.  This is where we configure the permissions required.

#### Lambda function master policy
```json
{
    "Version": "2012-10-17",
    "Statement": [
        {
          "Effect": "Allow",
          "Action": [
            "logs:CreateLogGroup",
            "logs:CreateLogStream",
            "logs:PutLogEvents"
          ],
          "Resource": "arn:aws:logs:*:*:*"
        },
        {
            "Sid": "Stmt1442379848000",
            "Effect": "Allow",
            "Action": [
                "s3:GetObject",
                "s3:ListBucket",
                "sts:*"
            ],
            "Resource": [
                "*"
            ]
        }
    ]
}
```

This contains permissions for:

1. Saving logs for your lambda execution.
2. Retrieving zipped CloudTrail log items from S3.
3. Assuming the auto-tag role on targeted accounts.

### 4. Configure the access policy for your Auto-Tag role

When auto-tag finds an event that indicated the creation of a resource, it needs permissions to tag that resource.  On each account, a role for cross account access will need to be created, with the following permissions.

*NOTE;* The role must be named 'AutoTagRole'.  
(This is a temporary hard requirement, given that after uploading the code via zip file, AWS doesn't allow the user to edit the main file inline.  This introduces complexity in user defined configuration for the lambda function.)

#### Auto-Tag role master policy
```json
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Sid": "Stmt1442379848000",
            "Effect": "Allow",
            "Action": [
                "s3:GetBucketTagging",
                "s3:PutBucketTagging",
                "ec2:CreateTags",
                "elasticloadbalancing:AddTags",
                "autoscaling:CreateOrUpdateTags",
                "rds:AddTagsToResource",
                "elasticmapreduce:AddTags",
                "datapipeline:AddTags"
            ],
            "Resource": [
                "*"
            ]
        }
    ]
}
```

Details on specific requirements for each service, in case you want a subset of this master policy:

* S3: `s3:GetBucketTagging`
      `s3:PutBucketTagging`
* EC2: `ec2:CreateTags`
* ELB: `elasticloadbalancing:AddTags`
* AutoScaling: `autoscaling:CreateOrUpdateTags`
* EBS: `ec2:CreateTags` (Same as EC2)
* VPC: `ec2:CreateTags` (Same as EC2)
* Subnet: `ec2:CreateTags` (Same as EC2)
* InternetGateway: `ec2:CreateTags` (Same as EC2)
* RDS: `rds:AddTagsToResource`
* EMR: `elasticmapreduce:AddTags`
* DataPipeline: `datapipeline:AddTags`


## Contributing

If you have questions, feature requests or bugs to report, please do so on the github repository.

If you are interested in contributing, please get started by forking our github repository and submit pull-requests.

### Development guide

Auto tag is implemented in Javascript (ECMAScript 2015 - a.k.a. es6).  To make this compatible with lambda and other es5 environments, we use [babel](https://babeljs.io/) to transpile the es6 code to es5.  For this reason, you will need to install babel globally to get started:

```bash
$ npm install -g babel
```

To setup babel to listen to the `src/` directory and transpile the code to es5, run:

```bash
$ babel -d lib --watch src  
```

To assist you in packaging and deploying your code to your lambda function, I have provided a script `deploy_lambda_code.sh`.  For this to run, you need the AWS CLI installed and an AWS profile available with sufficient access to deploy code.  Edit the script to provide your aws account id, lambda function name and location of the zipfile on your filesystem.

```bash
$ bash deploy_lambda_code.sh
```

To assist with running during development without having to deploy to lambda, use the `main.js` and `sample_data.js` files we have provided.

```bash
$ node main.js
```

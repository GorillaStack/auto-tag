# Autotag

This is an open-source tagging solution for AWS.  Deploy autotag to lambda and set up CloudTrail and have each of your resources tagged with the resource who created it.  It was written by GorillaStack.



## Setup

#### Baseline policies for your lambda IAM role

If you install your lambda function and don't plan on tagging resources, at very least you will need these permissions:

1. Permissions to save logs for your lambda execution.
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
    }
  ]
}
```

2. Permissions to retrieve zipped CloudTrail log items from S3.
```json
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Sid": "Stmt1442379848000",
            "Effect": "Allow",
            "Action": [
                "s3:GetObject",
                "s3:ListBucket"
            ],
            "Resource": [
                "*"
            ]
        }
    ]
}
```


#### Necessary policies for your lambda's IAM role
Actions to allow for all resources:

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

## Whole master policy
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

## Contributing

If you have questions, feature requests or bugs to report, please do so on the github repository.

If you are interested in contributing, please get started by forking our github repository and submit pull-requests.

### Development guide

Autotag is implemented in Javascript (ECMAScript 2015 - a.k.a. es6).  To make this compatible with lambda and other es5 environments, we use [babel](https://babeljs.io/) to transpile the es6 code to es5.  For this reason, you will need to install babel globally to get started:

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

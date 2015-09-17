# Autotag

This is an open-source tagging solution for AWS.  Deploy autotag to lambda and set up CloudTrail and have each of your resources tagged with the resource who created it.

## Setup

## Baseline policies for your lambda IAM role

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


## Necessary policies for your lambda's IAM role
Actions to allow for all resources:

* S3: `s3:GetBucketTagging`
      `s3:PutBucketTagging`
* EC2: `ec2:CreateTags`
* ELB: `elasticloadbalancing:AddTags`


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
                "s3:PutBucketTagging"
            ],
            "Resource": [
                "*"
            ]
        },
        {
            "Sid": "Stmt1442464541000",
            "Effect": "Allow",
            "Action": [
                "ec2:CreateTags"
            ],
            "Resource": [
                "*"
            ]
        },
        {
            "Sid": "Stmt1442466333000",
            "Effect": "Allow",
            "Action": [
                "elasticloadbalancing:AddTags"
            ],
            "Resource": [
                "*"
            ]
        }
    ]
}
```

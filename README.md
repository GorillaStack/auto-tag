# Auto Tag

This is an open-source tagging solution for AWS.  Deploy auto tag to lambda and set up CloudTrail and have each of your resources tagged with the resource who created it.  It was written by [GorillaStack](http://www.gorillastack.com/).

[Read a blog post about the project](http://blog.gorillastack.com/gorillastack-presents-auto-tag).

### Installation

We have [created a CloudFormation template](https://raw.githubusercontent.com/GorillaStack/auto-tag/master/cloud_formation/template.json) that creates all the resources required for AutoTag.

We also host each release of AutoTag in public s3 buckets in each region, such that all you have to do is install the CloudFormation template.

##### Through the console

1. Go to the [CloudFormation console](https://console.aws.amazon.com/cloudformation/home)
1. Click the blue "Create Stack" button
1. Select "Upload a template to Amazon S3", choosing the downloaded [CloudFormation template](https://raw.githubusercontent.com/GorillaStack/auto-tag/master/cloud_formation/template.json), then click the blue "Next" button
1. Name the stack "autotag" - this part is important, as the autotag code need to find the created resources through the API
1. In the parameter section:
  * CloudTrailBucketName: Name the S3 bucket that the template will create.  This needs to be unique for the region, so select something specific
  * CodeS3Bucket: As mentioned, we have a version of AutoTag in each region, to make deployment easy regardless of what region you are deploying your CloudFormation template.  Edit this parameter to match your region.  It should have the following pattern: `gorillastack-autotag-releases-${regionId}`.  E.g. `gorillastack-autotag-releases-ap-northeast-1`, `gorillastack-autotag-releases-us-west-1`
  * CodeS3Path: This is the version of AutoTag that you wish to deploy.  The default value `autotag-0.3.0.zip` is the latest version

## Contributing

If you have questions, feature requests or bugs to report, please do so on [the issues section of our github repository](https://github.com/GorillaStack/auto-tag/issues).

If you are interested in contributing, please get started by forking our github repository and submit pull-requests.

### Development guide

Auto tag is implemented in Javascript (ECMAScript 2015 - a.k.a. es6).

When the repository was first authored, this was not supported by the lambda node version (v0.10).  [Even now with version 4.3 support](https://aws.amazon.com/blogs/compute/node-js-4-3-2-runtime-now-available-on-lambda/), we still need to transpile code to es5 for compatibility, as not all language features are available (e.g. import etc).

##### Support for es5

If you still wish to transpile to es5 for older node versions run the following:

```bash
$ grunt run:babel  # runs interactively, issue ^C to existing
```

Export the generated es5 `lib/` directory to AWS rather than the es6 `src/` directory.

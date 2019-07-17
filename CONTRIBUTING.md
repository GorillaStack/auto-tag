# Contributing

**TODO - a lot of work to do on this file**

## Generating CloudFormation Templates

1. Change directory to `cloud_formation/event_multi_region_template`
1. Run `bundle install` to install the ruby dependencies to build the template
1. Running the ruby template builder helps to build a Lambda::InvokePermission for each region (SDK version dependent) `./autotag_event_main-template.rb expand > autotag_event_main-template.json`


## Uploading artifacts to GorillaStack artifact buckets

Upload the templates to `s3://gorillastack-autotag-releases/templates/`, setting their acl to `public-read`.

#!/bin/bash

echo "--- Transpile code"
npm run compile

echo "--- Zipping code for deployment"
pushd lib
zip -r autotag.zip *
popd
mv lib/autotag.zip .
npm prune --prod
zip -g autotag.zip -r node_modules/
echo "--- deploy lambda code to s3"
BUCKET_PREFIX="gorillastack-autotag-releases"
echo "upload code zip to S3 bucket"
aws s3 cp --acl public-read autotag.zip s3://${BUCKET_PREFIX}/autotag-0.5.0.zip 
echo "sync to each region"
# ap-south-1 bucket name has been taken
region_array=("ap-southeast-2" "ap-southeast-1" "ap-northeast-1" "ap-northeast-2" "eu-central-1" "eu-west-1" "eu-west-2" "eu-west-3" "us-west-1" "us-west-2" "us-east-1" "us-east-2" "ca-central-1")
for region in "${region_array[@]}"
do
  export AWS_DEFAULT_REGION=$region
  echo "aws sync to $region"
  aws s3 sync --acl public-read s3://${BUCKET_PREFIX}/ s3://${BUCKET_PREFIX}-$region/
done

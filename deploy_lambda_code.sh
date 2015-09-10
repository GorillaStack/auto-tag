#!/bin/bash

echo 1. Zipping code for deployment
pushd lib
zip -r autotag.zip *
popd
mv lib/autotag.zip .
echo ---
echo 2. Uploading code via AWS CLI
aws lambda --region ap-northeast-1 update-function-code --function-name arn:aws:lambda:ap-northeast-1:002790823159:function:gs_autotag --zip-file fileb:///home/e/dev/gs/autotag/autotag.zip
# aws s3 cp autotag.zip s3://gs-lambda-functions/autotag.zip

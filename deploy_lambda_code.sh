#!/bin/bash

echo 1. Zipping code for deployment
pushd lib
zip -r autotag.zip *
popd
mv lib/autotag.zip .
zip -g autotag.zip -r node_modules/
echo ---
echo 2. Uploading code via AWS CLI
aws lambda --region ap-northeast-1 update-function-code --function-name arn:aws:lambda:[AWS_REGION]:[AWS_ACCOUNT_ID]:function:gs_autotag --zip-file fileb:///[PATH_TO_AUTOTAG_DIR]/autotag.zip

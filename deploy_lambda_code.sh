#!/bin/bash

echo 1. Transpile code
npm run compile

echo 2. Zipping code for deployment
pushd lib
zip -r autotag.zip *
popd
mv lib/autotag.zip .
npm prune --prod
zip -g autotag.zip -r node_modules/
#echo ---
echo 3. Uploading code via AWS CLI
aws s3 cp autotag.zip s3://gorillastack-autotag-releases/autotag-test.zip --acl public-read
#aws lambda --region ap-northeast-1 update-function-code --function-name arn:aws:lambda:[AWS_REGION]:[AWS_ACCOUNT_ID]:function:gs_autotag --zip-file fileb:///[PATH_TO_AUTOTAG_DIR]/autotag.zip

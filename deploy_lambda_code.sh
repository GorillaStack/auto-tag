#!/bin/bash

echo Zipping code for deployment
zip code.zip lib/autotag.js

echo Uploading code via AWS CLI
aws lambda --region ap-northeast-1 update-function-code --function-name arn:aws:lambda:ap-northeast-1:002790823159:function:gs_autotag --zip-file fileb:///home/e/dev/gs/autotag/code.zip

#!/bin/bash
./scripts/package.sh
aws lambda update-function-code --region eu-central-1 --function-name simple-lambda-demo --zip-file fileb://simple-lambda-demo.zip
#!/bin/bash
if aws s3 ls "s3://anton.al.ivanov-lambda-src" 2>&1 | grep -q 'NoSuchBucket'
then
  echo "Bucket does not exist"
  aws s3api create-bucket --bucket anton.al.ivanov-lambda-src\
    --region eu-central-1\
    --create-bucket-configuration LocationConstraint=eu-central-1
else
  echo "Bucket exists"
fi
./scripts/package.sh
aws s3 cp simple-lambda-demo.zip s3://anton.al.ivanov-lambda-src
aws cloudformation deploy --template-file cfn.yaml --stack-name simple-lambda-demo --capabilities CAPABILITY_NAMED_IAM
# Optionally we can also delete the S3 bucket and the source code, however the bucket might be shared with other Lambda functions
aws cloudformation delete-stack --stack-name simple-lambda-demo
rm simple-lambda-demo.zip
zip -r simple-lambda-demo.zip index.js node_modules/*
aws lambda update-function-code --region eu-central-1 --function-name simple-lambda-demo --zip-file fileb://simple-lambda-demo.zip
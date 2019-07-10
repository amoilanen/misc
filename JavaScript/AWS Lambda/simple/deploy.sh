rm function.zip
zip -r function.zip index.js node_modules/*
aws lambda update-function-code --region eu-central-1 --function-name simple-lambda-demo --zip-file fileb://function.zip
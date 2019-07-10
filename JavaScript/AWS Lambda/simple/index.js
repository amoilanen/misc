const _ = require('lodash');

async function handler(event, context) {
  const max =_.max([5, 2, 4, 3, 1]);
  console.log(`Max ${max}`);
}

const isRunningLocally = !process.env.LAMBDA_TASK_ROOT;

if (isRunningLocally) {
  handler();
}

exports.handler = handler;
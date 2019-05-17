var expression = 'a+b*c+(d+e)*f';
var characters = expression.split('');

var output = [];
var operators = [];

function peek(stack) {
  return (stack.length > 0) ? stack[stack.length - 1] : undefined;
}

function isOperator(character) {
  return character === '+' || character === '*';
}

var precedences = {
  '+': 1,
  '*': 2
}

characters.forEach(character => {
  if (isOperator(character)) {
    let currentOperator = character;
    let topOperator = peek(operators);
    while (!!topOperator && topOperator !== '(' && (precedences[topOperator] >= precedences[currentOperator])) {
      output.push(topOperator);
      operators.pop();
      topOperator = peek(operators);
    }
    operators.push(currentOperator);
  } else if (character === ')') {
    let topOperator = peek(operators);
    while (!!topOperator && topOperator !== '(') {
      output.push(topOperator);
      operators.pop();
      topOperator = peek(operators);
    }
    if (topOperator === '(') {
      operators.pop();
    }
  } else if (character === '(') {
    operators.push(character);
  } else {
    output.push(character);
  }
});

output = output.concat(operators.reverse());

console.log('output = ', output);
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
};

function pushOperator(operator) {
  const rightOperand = output.pop();
  const leftOperand = output.pop();
  output.push({
    left: leftOperand,
    right: rightOperand,
    op: operator
  });
}

function pushOperand(operand) {
  output.push(operand);
}

characters.forEach(character => {
  if (isOperator(character)) {
    let currentOperator = character;
    let topOperator = peek(operators);
    while (!!topOperator && topOperator !== '(' && (precedences[topOperator] >= precedences[currentOperator])) {
      pushOperator(topOperator);
      operators.pop();
      topOperator = peek(operators);
    }
    operators.push(currentOperator);
  } else if (character === ')') {
    let topOperator = peek(operators);
    while (!!topOperator && topOperator !== '(') {
      pushOperator(topOperator);
      operators.pop();
      topOperator = peek(operators);
    }
    if (topOperator === '(') {
      operators.pop();
    }
  } else if (character === '(') {
    operators.push(character);
  } else {
    pushOperand(character);
  }
});

while (operators.length > 0) {
  pushOperator(operators.pop());
}

// Abstract Syntax Tree representation of the expression
var ast = output.pop();

//abc*+de+f*+
console.log('output = ', JSON.stringify(ast, null, 2));

function isTree(node) {
  return node.op !== undefined;
}

function toInfixForm(ast) {
  if (isTree(ast)) {
    const { left, right, op } = ast;
    return `(${toInfixForm(left)}${op}${toInfixForm(right)})`;
  } else {
    return ast;
  }
}

//a+b*c+(d+e)*f
//((a+(b*c))+((d+e)*f))
console.log('with parentheses = ', toInfixForm(ast));
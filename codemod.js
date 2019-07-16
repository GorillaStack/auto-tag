const CALL_CO_EXPRESSION = { type: 'CallExpression', callee: { name: 'co' } };
const THIS_VARIABLE = '_this';

const functionBodyFilter = (j, functionBody) =>
  functionBody.find(statement => statement.type === 'ReturnStatement' && j.match(statement.argument, CALL_CO_EXPRESSION));

const coFunctionFilter = j => x => {
  const functionBody = x.value.body.body;

  return functionBodyFilter(j, functionBody);
};

const coArrowFunctionFilter = j => x => {
  if (!x.value.expression) {
    return functionBodyFilter(j, x.value.body.body);
  } else {
    return j.match(x.value.body, CALL_CO_EXPRESSION);
  }
};

const coMethodFilter = j => x => {
  const functionBody = x.value.value.body.body;

  return functionBodyFilter(j, functionBody);
};

const replaceYieldWithAwait = (j, funcExpr) => j(funcExpr)
    .find(j.YieldExpression)
    .replaceWith(yieldExpr => j.awaitExpression(yieldExpr.value.argument));

function removeCoAndReplaceYield(j, funcExpr) {
// grab the function body of the co() parameter function and move its statements to the parent function
  j(funcExpr)
    .find(j.ReturnStatement, { argument: CALL_CO_EXPRESSION })
    .replaceWith(path => {
    const coCall = path.value.argument;
    const coFunction = coCall.arguments[0];
    const statements = coFunction.body.body;
    return statements;
  });

  // replace yield with await
  replaceYieldWithAwait(j, funcExpr);
}

function updateMethod(j, funcExpr) {
  // remove `(var|const|let) _this = this;` expressions
  j(funcExpr)
    .find(j.VariableDeclaration,
          { declarations: [{ type: 'VariableDeclarator', id: { name: THIS_VARIABLE }, init: { type: 'ThisExpression' } }] })
    .remove();

  j(funcExpr)
    .find(j.MemberExpression, { object: { name: THIS_VARIABLE } })
    .replaceWith(member => j.memberExpression(j.identifier('this'), member.value.property));

  removeCoAndReplaceYield(j, funcExpr);
}

const coMethodDefinitionRewriter = j => x => {
  const funcExpr = x.value.value;
  updateMethod(j, funcExpr);
  funcExpr.async = true;
  return j.methodDefinition.from({
    comments: x.value.comments || null,
    kind: x.value.kind,
    key: x.value.key,
    computed: x.value.computed,
    static: x.value.static,
    value: funcExpr,
  });
};

const coFunctionDeclarationRewriter = j => x => {
  const funcExpr = x.value;
  funcExpr.async = true;
  removeCoAndReplaceYield(j, funcExpr);

  const newFD = j.functionDeclaration.from(funcExpr);
  newFD.async = true;
  return newFD;
};

const coArrowFunctionRewriter = j => x => {
  let newAFD;
  if (!x.value.expression) {
    const body = x.value.body;
    removeCoAndReplaceYield(j, body);
    newAFD = j.arrowFunctionExpression(x.value.params, body);
  } else {
    const coCall = x.value.body;
    const coFunction = coCall.arguments[0];
    const statements = coFunction.body.body;
    replaceYieldWithAwait(j, coFunction);
    newAFD = j.arrowFunctionExpression(x.value.params, j.blockStatement(statements));
  }
  newAFD.async = true;
  return newAFD;
};

const trimComment = comment => ({ ...comment, value: comment.value.trim() });
const slimComment = comment => ({ type: 'CommentBlock', value: comment.value, loc: null });

export default function transformer(file, api) {
  const j = api.jscodeshift;

  const code = j(file.source);

  code
    .find(j.MethodDefinition, { value: { async: false } })
    .filter(coMethodFilter(j))
    .replaceWith(coMethodDefinitionRewriter(j));

  code.find(j.ArrowFunctionExpression)
    .filter(coArrowFunctionFilter(j))
    .replaceWith(coArrowFunctionRewriter(j));

  code.find(j.FunctionDeclaration, { async: false })
    .filter(coFunctionFilter(j))
    .replaceWith(coFunctionDeclarationRewriter(j))

  code.find(j.ImportDeclaration)
    .filter(x => x.value.source.value === 'co')
    .replaceWith(x => x.value.comments ? j.noop.from({ comments: x.value.comments.map(slimComment) }) : j.noop())

  return code.toSource();
}
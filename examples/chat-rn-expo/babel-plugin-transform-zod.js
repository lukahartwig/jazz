// Custom Babel plugin to transform Zod's dynamic class generation
// This makes it more compatible with Hermes

module.exports = function (babel) {
  const { types: t } = babel;

  return {
    name: "transform-zod-multi-fixes",
    visitor: {
      FunctionDeclaration(path) {
        // Part 1: Target Zod's $constructor function
        if (path.node.id?.name === "$constructor") {
          path.traverse({
            CallExpression(callPath) {
              const { node } = callPath;
              const callee = node.callee;
              if (
                t.isMemberExpression(callee) &&
                t.isIdentifier(callee.object, { name: "Object" }) &&
                t.isIdentifier(callee.property, { name: "defineProperty" }) &&
                node.arguments.length >= 3 &&
                t.isIdentifier(node.arguments[0]) &&
                node.arguments[0].name === "_" &&
                t.isStringLiteral(node.arguments[1], { value: "name" })
              ) {
                callPath.remove();
              }
            },
            ClassDeclaration(classPath) {
              // Ensure we're targeting the class '_' inside $constructor
              if (classPath.node.id?.name === "_") {
                classPath.traverse({
                  ClassMethod(methodPath) {
                    const { node: methodNode } = methodPath; // Renamed to avoid conflict with outer 'node'
                    if (
                      methodNode.static &&
                      methodNode.computed &&
                      t.isMemberExpression(methodNode.key) &&
                      t.isIdentifier(methodNode.key.object, {
                        name: "Symbol",
                      }) &&
                      t.isIdentifier(methodNode.key.property, {
                        name: "hasInstance",
                      })
                    ) {
                      methodPath.remove();
                    }
                  },
                });
              }
            },
          });
        }

        // Part 2: Target Zod's setFunctionName utility (Temporarily Disabled)
        /* if (path.node.id?.name === 'setFunctionName') {
          const fnParam = path.node.params[0]; // First parameter, typically 'fn'
          if (fnParam && t.isIdentifier(fnParam)) {
            const fnParamName = fnParam.name;
            path.traverse({
              CallExpression(callPath) {
                const { node } = callPath;
                const callee = node.callee;
                if (
                  t.isMemberExpression(callee) &&
                  t.isIdentifier(callee.object, { name: 'Object' }) &&
                  t.isIdentifier(callee.property, { name: 'defineProperty' }) &&
                  node.arguments.length >= 3 &&
                  t.isIdentifier(node.arguments[0], { name: fnParamName }) && // Target is the 'fn' param
                  t.isStringLiteral(node.arguments[1], { value: 'name' })
                ) {
                  callPath.remove();
                }
              }
            });
          }
        } */
      },
    },
  };
};

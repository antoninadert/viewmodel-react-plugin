"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});

exports.default = function (_ref) {
  var t = _ref.types;

  return {
    visitor: {
      CallExpression: function CallExpression(p) {
        // Only do this if we find a view model
        if (notViewModel(p)) return;

        // Add "import React from 'react';" if the variable React isn't defined
        var rootPath = p.parentPath.parentPath;
        if (!isDefined(rootPath, 'React')) {
          addReactImport(rootPath, t);
        }
        var componentName = p.node.callee.name;
        var identifier = t.identifier(componentName);
        var objectIdentifier = t.identifier('React');
        var propertyIdentifier = t.identifier('Component');
        var memberExpression = t.memberExpression(objectIdentifier, propertyIdentifier, false);
        //const method = getMethod(t);
        var classBody = t.classBody([]);
        var classDeclaration = t.classDeclaration(identifier, memberExpression, classBody, []);
        //displayMembers(t, "export");
        var exportDeclaration = t.exportNamedDeclaration(classDeclaration, []);
        p.replaceWith(exportDeclaration);
      }
    }
  };
};

var isDefined = function isDefined(p, variable) {
  return p.scope.hasOwnBinding(variable);
};
var noName = function noName(p) {
  return !p.node.callee.name;
};
var notExpressionStatement = function notExpressionStatement(p) {
  return p.parent.type !== "ExpressionStatement";
};
var notAtRoot = function notAtRoot(p) {
  return p.parentPath.parent.type !== "Program";
};
var notCapitalized = function notCapitalized(p) {
  return p.node.callee.name[0] === p.node.callee.name[0].toLowerCase();
};
var defined = function defined(p) {
  return isDefined(p, p.node.callee.name);
};
var incorrectArguments = function incorrectArguments(p) {
  return p.node.arguments.length !== 1 || p.node.arguments[0].type !== "ObjectExpression";
};
var noRender = function noRender(p) {
  return !p.node.arguments[0].properties.some(function (p) {
    return p.type === "ObjectMethod" && p.key.name === "render";
  });
};

var notViewModel = function notViewModel(p) {
  return noName(p) || notExpressionStatement(p) || notAtRoot(p) || notCapitalized(p) || incorrectArguments(p) || noRender(p) || defined(p);
};

var addReactImport = function addReactImport(path, t) {
  var identifier = t.identifier('React');
  var importDefaultSpecifier = t.importDefaultSpecifier(identifier);
  var importDeclaration = t.importDeclaration([importDefaultSpecifier], t.stringLiteral('react'));
  path.unshiftContainer('body', importDeclaration);
};

var getMethod = function getMethod(t) {
  var identifier = t.identifier('one');
  var blockStatement = t.blockStatement([]);
  var blankIdentifier = t.identifier("");
  var functionExpression = t.functionExpression(blankIdentifier, [], blockStatement, false);
  var methodDefinition = t.classMethod('method', identifier, [], t.blockStatement([]), false, false);
  return methodDefinition;
};

var displayMembers = function displayMembers(obj, match) {
  console.log("vvvvvvvvvvvvv ( ${match} ) vvvvvvvvvvvvv");
  for (var prop in obj) {
    if (~prop.toLowerCase().indexOf(match.toLowerCase())) {
      console.log(prop);
    }
  }
  console.log("^^^^^^^^^^^^^ ( ${match} ) ^^^^^^^^^^^^^");
};
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _slicedToArray = function () { function sliceIterator(arr, i) { var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"]) _i["return"](); } finally { if (_d) throw _e; } } return _arr; } return function (arr, i) { if (Array.isArray(arr)) { return arr; } else if (Symbol.iterator in Object(arr)) { return sliceIterator(arr, i); } else { throw new TypeError("Invalid attempt to destructure non-iterable instance"); } }; }();

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

exports.default = function (_ref) {
  var types = _ref.types;

  return {
    visitor: {
      CallExpression: function CallExpression(path, state) {
        t = types;
        var helper = new _Helper2.default(path, t);

        // Only do this if we find a view model (not declared already)
        if (path.scope.hasBinding(helper.vmName()) || !helper.isViewModel()) return;

        if (state.opts && state.opts.useInferno) {
          helper.addImportDeclaration("Inferno", "inferno");
          helper.addImportDeclaration("Component", "inferno-component");
        } else {
          helper.addImportDeclaration("React", "react");
        }

        helper.addImportDeclaration("ViewModel", "viewmodel-react");
        helper.addVariableDeclaration();

        var _helper$initialMethod = helper.initialMethodsAndProperties(),
            _helper$initialMethod2 = _slicedToArray(_helper$initialMethod, 2),
            initialMethods = _helper$initialMethod2[0],
            initialProperties = _helper$initialMethod2[1];

        var componentName = path.node.callee.name;
        helper.prepareConstructor(componentName, initialMethods, initialProperties);
        var classMethods = helper.classMethods(initialMethods);

        var identifier = t.identifier(componentName);
        var objectIdentifier = t.identifier("React");
        var propertyIdentifier = t.identifier("Component");
        var memberExpression = t.memberExpression(objectIdentifier, propertyIdentifier, false);
        var extended = state.opts && state.opts.useInferno ? propertyIdentifier : memberExpression;
        var classBody = t.classBody(classMethods);
        var classDeclaration = t.classDeclaration(identifier, extended, classBody, []);
        var exportDeclaration = t.exportNamedDeclaration(classDeclaration, []);
        path.parentPath.replaceWith(exportDeclaration);

        path.parentPath.traverse(elementVisitor, state);

        path.parentPath.traverse(innerVisitor, state);
      }
    }
  };
};

var _Helper = require("./Helper");

var _Helper2 = _interopRequireDefault(_Helper);

var _parseBind = require("./parseBind");

var _bindings = require("./bindings");

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var ran = false;
var t = void 0;
var bad = {
  start: 1,
  end: 1,
  loc: 1
};
function log(obj) {
  console.log(dump(obj));
}
function dump(arr, level) {
  var dumped_text = "";
  if (!level) level = 0;

  var level_padding = "";
  for (var j = 0; j < level + 1; j++) {
    level_padding += "  ";
  }if ((typeof arr === "undefined" ? "undefined" : _typeof(arr)) == "object") {
    for (var item in arr) {
      if (bad[item]) continue;
      var value = arr[item];

      if ((typeof value === "undefined" ? "undefined" : _typeof(value)) == "object") {
        dumped_text += level_padding + "'" + item + "' ...\n";
        dumped_text += dump(value, level + 1);
      } else {
        if (item[0] !== "_") {
          dumped_text += level_padding + "'" + item + "' => \"" + value + '"\n';
        }
      }
    }
  } else {
    dumped_text = "===>" + arr + "<===(" + (typeof arr === "undefined" ? "undefined" : _typeof(arr)) + ")";
  }
  return dumped_text;
}

var isString = function isString(str) {
  return typeof str === "string" || str instanceof String;
};

var innerVisitor = {
  JSXAttribute: function JSXAttribute(path, state) {
    var helper = new _Helper2.default(path, t);
    if (!helper.hasImport("ViewModel")) return;
    if (path.node.name.name === "b" && !(path.node.value && path.node.value.value)) {
      path.remove();
    } else if (path.node.name.name === "b") {
      var attributes = {};
      if (state.opts && state.opts.attributes) {
        var _iteratorNormalCompletion = true;
        var _didIteratorError = false;
        var _iteratorError = undefined;

        try {
          for (var _iterator = state.opts.attributes[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
            var attr = _step.value;

            attributes[attr] = 1;
          }
        } catch (err) {
          _didIteratorError = true;
          _iteratorError = err;
        } finally {
          try {
            if (!_iteratorNormalCompletion && _iterator.return) {
              _iterator.return();
            }
          } finally {
            if (_didIteratorError) {
              throw _iteratorError;
            }
          }
        }
      }
      var bindingText = path.node.value.value;
      var bindingObject = (0, _parseBind.parseBind)(bindingText);
      for (var binding in bindingObject) {
        if (_bindings.bindings[binding]) {
          _bindings.bindings[binding].process((0, _parseBind.bindToString)(bindingObject[binding]), path, t, binding, bindingObject);
        } else if (attributes[binding]) {
          _bindings.bindings.singleAttribute.process((0, _parseBind.bindToString)(bindingObject[binding]), path, t, binding, bindingObject);
        }
      }
      var openingElementPath = path.parentPath;
      var initial = openingElementPath.node.name.name.substr(0, 1);
      if (initial === initial.toLowerCase()) {
        _bindings.bindings.defaultBinding.process(bindingText, path, t, _bindings.bindings.defaultBinding, bindingObject);
      }

      if (!openingElementPath.node.attributes.some(function (a) {
        return a.name && a.name.name === "data-bind";
      })) {
        var jSXAttribute = t.jSXAttribute(t.jSXIdentifier("data-bind"), t.stringLiteral(path.node.value.value));
        openingElementPath.node.attributes.push(jSXAttribute);
      }

      path.remove();
    } else if (path.node.name.name === "value") {
      var hasBinding = false;
      var _iteratorNormalCompletion2 = true;
      var _didIteratorError2 = false;
      var _iteratorError2 = undefined;

      try {
        for (var _iterator2 = path.parent.attributes[Symbol.iterator](), _step2; !(_iteratorNormalCompletion2 = (_step2 = _iterator2.next()).done); _iteratorNormalCompletion2 = true) {
          var attribute = _step2.value;

          if (attribute.name.name === "b") {
            hasBinding = true;
            break;
          }
        }
      } catch (err) {
        _didIteratorError2 = true;
        _iteratorError2 = err;
      } finally {
        try {
          if (!_iteratorNormalCompletion2 && _iterator2.return) {
            _iterator2.return();
          }
        } finally {
          if (_didIteratorError2) {
            throw _iteratorError2;
          }
        }
      }

      if (hasBinding) {
        path.node.name.name = "defaultValue";
      }
    } else if (path.node.name.name === "class") {
      path.node.name.name = "className";
    } else if (path.node.name.name === "for") {
      path.node.name.name = "htmlFor";
    } else if (path.node.name.name === "style" && path.node.value.type === "StringLiteral") {
      var _iteratorNormalCompletion3 = true;
      var _didIteratorError3 = false;
      var _iteratorError3 = undefined;

      try {
        for (var _iterator3 = path.parent.attributes[Symbol.iterator](), _step3; !(_iteratorNormalCompletion3 = (_step3 = _iterator3.next()).done); _iteratorNormalCompletion3 = true) {
          var _attribute = _step3.value;

          if (_attribute.name.name === "b") {
            if ((0, _parseBind.parseBind)(_attribute.value.value).style) {
              return;
            }
            break;
          }
        }
      } catch (err) {
        _didIteratorError3 = true;
        _iteratorError3 = err;
      } finally {
        try {
          if (!_iteratorNormalCompletion3 && _iterator3.return) {
            _iterator3.return();
          }
        } finally {
          if (_didIteratorError3) {
            throw _iteratorError3;
          }
        }
      }

      var newValue = path.node.value.value;
      if (~newValue.indexOf(";")) {
        newValue = newValue.split(";").join(",");
      }

      var bind = (0, _parseBind.parseBind)(newValue);
      var properties = [];
      for (var bindName in bind) {
        if (!bindName) continue;
        var newName = helper.reactStyle(bindName);
        var identifier = t.identifier(newName);
        var withoutQuotes = helper.removeQuotes(bind[bindName]);
        var objectProperty = t.objectProperty(identifier, t.stringLiteral(withoutQuotes));
        properties.push(objectProperty);
      }
      var objectExpression = t.objectExpression(properties);
      var jSXExpressionContainer = t.jSXExpressionContainer(objectExpression);
      path.node.value = jSXExpressionContainer;
    }
  },
  JSXOpeningElement: function JSXOpeningElement(path) {
    var helper = new _Helper2.default(path, t);
    if (!helper.hasImport("ViewModel")) return;
    var name = path.node.name.name;
    if (!path.node.name.name || name[0] === name[0].toLowerCase()) return;
    helper.addParentAttribute();
    if (name === "VmLazyL") return;
    if (!path.scope.hasBinding(name)) {
      helper.addImportDeclaration(name, "./" + name + "/" + name, false);
    }
  }
};

var elementVisitor = {
  JSXElement: function JSXElement(path, state) {
    var helper = new _Helper2.default(path, t);
    if (!helper.hasImport("ViewModel")) return;
    var hasIf = false;
    var index = -1;
    var bindingText = null;
    var attributes = void 0;
    var ran = false;

    var _iteratorNormalCompletion4 = true;
    var _didIteratorError4 = false;
    var _iteratorError4 = undefined;

    try {
      for (var _iterator4 = path.node.openingElement.attributes[Symbol.iterator](), _step4; !(_iteratorNormalCompletion4 = (_step4 = _iterator4.next()).done); _iteratorNormalCompletion4 = true) {
        var attr = _step4.value;

        index++;
        if (attr.name && attr.name.name === "b") {
          if (!path.node.openingElement.attributes.some(function (a) {
            return a.name && a.name.name === "data-bind";
          })) {
            path.node.openingElement.attributes.push(t.jSXAttribute(t.jSXIdentifier("data-bind"), t.stringLiteral(attr.value.value)));
          }
          hasIf = true;
          bindingText = attr.value.value;
          var bindingObject = (0, _parseBind.parseBind)(bindingText);

          if (bindingObject["if"]) {
            var binding = bindingObject["if"];
            var bindText = (0, _parseBind.bindToString)(binding);
            var jSXElement = path.node;
            var callExpression = (0, _bindings.getVmCallExpression)(false, bindingObject, path, t, "getValue", t.stringLiteral(bindText));
            var conditionalExpression = t.conditionalExpression(callExpression, jSXElement, t.nullLiteral());
            if (path.parent.type === "ReturnStatement") {
              path.replaceWith(conditionalExpression);
            } else {
              path.replaceWith(t.jSXExpressionContainer(conditionalExpression));
            }

            delete bindingObject["if"];
            attr.value.value = (0, _parseBind.bindToString)(bindingObject);
          }

          if (bindingObject["repeat"]) {
            var _binding = bindingObject["repeat"];
            var _bindText = (0, _parseBind.bindToString)(_binding);
            var _jSXElement = path.node;

            var callExpressionGetValue = (0, _bindings.getVmCallExpression)(true, bindingObject, path, t, "getValue", t.stringLiteral(_bindText));

            var memberExpressionMap = t.memberExpression(callExpressionGetValue, t.identifier("map"), false);
            var returnStatement = t.returnStatement(_jSXElement);
            var blockStatement = t.blockStatement([returnStatement]);

            var arrowFunctionExpression = t.arrowFunctionExpression([t.identifier("repeatObject"), t.identifier("repeatIndex")], blockStatement);

            var callExpressionMap = t.callExpression(memberExpressionMap, [arrowFunctionExpression]);
            var jSXExpressionContainer = t.jSXExpressionContainer(callExpressionMap);

            var initial = _jSXElement.openingElement.name.name[0];
            if (initial === initial.toUpperCase()) {
              var jSXSpreadAttribute = t.jSXSpreadAttribute(t.identifier("repeatObject"));
              _jSXElement.openingElement.attributes.push(jSXSpreadAttribute);
            }

            var jSXExpressionContainerKey = void 0;
            if (bindingObject.key) {
              var memberExpressionKey = t.memberExpression(t.identifier("repeatObject"), t.identifier(bindingObject.key));
              jSXExpressionContainerKey = t.jSXExpressionContainer(memberExpressionKey);
            } else {
              jSXExpressionContainerKey = t.jSXExpressionContainer(t.identifier("repeatIndex"));
            }

            var jSXAttribute = t.jSXAttribute(t.jSXIdentifier("key"), jSXExpressionContainerKey);
            _jSXElement.openingElement.attributes.push(jSXAttribute);
            attributes = _jSXElement.openingElement.attributes;

            if (path.parent.type === "ConditionalExpression") {
              path.replaceWith(callExpressionMap);
            } else {
              path.replaceWith(jSXExpressionContainer);
            }

            delete bindingObject["repeat"];
            delete bindingObject["key"];
            attr.value.value = (0, _parseBind.bindToString)(bindingObject);
          }

          if (bindingObject["defer"]) {
            var _binding2 = bindingObject["defer"];
            var _bindText2 = (0, _parseBind.bindToString)(_binding2);
            var _jSXElement2 = path.node;
            var replacement = state.opts && state.opts.deferWithRequire ? _bindings.bindings.defer.getReplacementWithRequire(_jSXElement2, t, bindingObject, path, _bindText2) : _bindings.bindings.defer.getReplacement(_jSXElement2, t, bindingObject, path, _bindText2);
            path.replaceWith(replacement);
            delete bindingObject["defer"];
            attr.value.value = (0, _parseBind.bindToString)(bindingObject);
          }
        }
      }
    } catch (err) {
      _didIteratorError4 = true;
      _iteratorError4 = err;
    } finally {
      try {
        if (!_iteratorNormalCompletion4 && _iterator4.return) {
          _iterator4.return();
        }
      } finally {
        if (_didIteratorError4) {
          throw _iteratorError4;
        }
      }
    }
  }
};
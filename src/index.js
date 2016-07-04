import Helper from './Helper'
import { parseBind, bindToString } from './parseBind'
import bindings from './bindings'

let ran = false;

var bad = {
  start: 1, end: 1, loc: 1
}

const compiledBindings = {
  text: 1,
  html: 1,
  'class': 1,
<<<<<<< 23d517ac38e179a88d0c9be093c1957523528f3c
  'if': 1
=======
  'if': 1,
  'style': 1
>>>>>>> 1668139e982a4f058f290b3c8181637627a84cf9
}

function dump(arr,level) {
  var dumped_text = "";
  if(!level) level = 0;

  var level_padding = "";
  for(var j=0;j<level+1;j++) level_padding += "  ";

  if(typeof(arr) == 'object') {
    for(var item in arr) {
      if (bad[item]) continue;
      var value = arr[item];

      if(typeof(value) == 'object') {
        dumped_text += level_padding + "'" + item + "' ...\n";
        dumped_text += dump(value,level+1);
      } else {
        if (item[0] !== '_') {
          dumped_text += level_padding + "'" + item + "' => \"" + value + "\"\n";
        }
      }
    }
  } else {
    dumped_text = "===>"+arr+"<===("+typeof(arr)+")";
  }
  return dumped_text;
};

const isString = function(str) {
  return typeof str === 'string' || str instanceof String;
}

export default function ({types: t }) {
  return {
    visitor: {
      CallExpression(path){
        const helper = new Helper(path, t);

        // Only do this if we find a view model (not declared already)
        if (path.scope.hasBinding(helper.vmName()) || !helper.isViewModel()) return;

        helper.addImportDeclaration('React', 'react');
        helper.addImportDeclaration('ViewModel', 'viewmodel-react');

        let [initialMethods, initialProperties] = helper.initialMethodsAndProperties()

        const componentName = path.node.callee.name;
        helper.prepareConstructor(componentName, initialMethods, initialProperties);
        const classMethods = helper.classMethods(initialMethods);
        
        const identifier = t.identifier(componentName);
        const objectIdentifier = t.identifier('React');
        const propertyIdentifier = t.identifier('Component');
        const memberExpression = t.memberExpression(objectIdentifier, propertyIdentifier, false);
        const classBody = t.classBody(classMethods);
        const classDeclaration = t.classDeclaration(identifier, memberExpression, classBody, []);
        const exportDeclaration = t.exportNamedDeclaration(classDeclaration, []);
        path.parentPath.replaceWith(exportDeclaration);

      },
      
      JSXAttribute(path) {
        const helper = new Helper(path, t);
        if (path.node.name.name === "b") {

          const bindingText = path.node.value.value;
          const bindingObject = parseBind(bindingText);
          let allCompiled = true;
          for (let binding in bindingObject) {
            if (allCompiled && !compiledBindings[binding]) allCompiled = false;
            if (bindings[binding]) {
              bindings[binding].process(bindToString(bindingObject[binding]), path, t, binding, bindingObject);  
            }
          }
          if (!allCompiled) {
            bindings.defaultBinding.process(bindingText, path, t);  
          }
<<<<<<< 23d517ac38e179a88d0c9be093c1957523528f3c
=======
          path.remove();
>>>>>>> 1668139e982a4f058f290b3c8181637627a84cf9
        } else if (path.node.name.name === "value") {
          let hasBinding = false;
          for(let attribute of path.parent.attributes) {
            if (attribute.name.name === "b") {
              hasBinding = true;
              break;
            }
          }
          if (hasBinding) {
            path.node.name.name = "defaultValue";
          }
        } else if (path.node.name.name === "class") {
          path.node.name.name = "className";
        } else if (path.node.name.name === "style" && path.node.value.type === 'StringLiteral') {
          for(let attribute of path.parent.attributes) {
            if (attribute.name.name === "b") {
              if (parseBind(attribute.value.value).style) {
                return;
              }
              break;
            }
          }

          let newValue = path.node.value.value;
          if (~newValue.indexOf(";")) {
            newValue = newValue.split(";").join(",")
          }
          const bind = parseBind(newValue);
          const properties = [];
          for(let bindName in bind) {
            if (!bindName) continue;
            let newName = helper.reactStyle(bindName);
            let identifier = t.identifier(newName);
            let withoutQuotes = helper.removeQuotes(bind[bindName]);
            let objectProperty = t.objectProperty( identifier, t.stringLiteral(withoutQuotes) );
            properties.push(objectProperty);
          }
          const objectExpression = t.objectExpression(properties);
          const jSXExpressionContainer = t.jSXExpressionContainer(objectExpression);
          path.node.value = jSXExpressionContainer;
        }
      },

      JSXOpeningElement(path){
        const helper = new Helper(path, t);
        const name = path.node.name.name;
        if (name[0] === name[0].toLowerCase()) return;
        helper.addParentAttribute();
        if (!path.scope.hasBinding(name)) {
          helper.addImportDeclaration(name, './' + name + '/' + name, false);
        }
      }

    }
  };
}
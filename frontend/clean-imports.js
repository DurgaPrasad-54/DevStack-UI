const fs = require('fs');
const path = require('path');
const parser = require('@babel/parser');
const { default: traverse } = require('@babel/traverse');
const { default: generate } = require('@babel/generator');

// Helper to recursively list files in directory
function getFiles(dir) {
  let results = [];
  if (!fs.existsSync(dir)) return results;
  
  const list = fs.readdirSync(dir);
  list.forEach((file) => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    if (stat && stat.isDirectory()) {
      results = results.concat(getFiles(filePath));
    } else if (file.endsWith('.js') || file.endsWith('.jsx')) {
      results.push(filePath);
    }
  });
  return results;
}

const srcDir = path.join(__dirname, 'src');
const files = getFiles(srcDir);
let totalUnusedImports = 0;
let modifiedFilesCount = 0;

console.log(`🔍 Scanning ${files.length} frontend source files in src/...\n`);

files.forEach((file) => {
  const code = fs.readFileSync(file, 'utf8');
  let ast;
  try {
    ast = parser.parse(code, {
      sourceType: 'module',
      plugins: [
        'jsx',
        'decorators-legacy',
        'classProperties',
        'objectRestSpread',
        'optionalChaining',
        'nullishCoalescingOperator',
        'exportDefaultFrom',
        'dynamicImport',
        'exportNamespaceFrom',
        'asyncGenerators',
        'functionBind',
        'functionSent'
      ]
    });
  } catch (err) {
    console.error(`⚠️ Failed to parse ${path.relative(__dirname, file)}: ${err.message}`);
    return;
  }

  const unusedImports = [];
  const unusedVariables = [];

  traverse(ast, {
    ImportDeclaration(pathNode) {
      const specifiers = pathNode.node.specifiers;
      if (specifiers.length === 0) return; // Side-effect imports (e.g. CSS, stylesheets)

      specifiers.forEach((specifier) => {
        const localName = specifier.local.name;
        const binding = pathNode.scope.getBinding(localName);
        
        // Check if binding is not referenced anywhere in its scope
        if (binding && !binding.referenced) {
          unusedImports.push({
            localName,
            specifierPath: specifier,
            declarationPath: pathNode
          });
        }
      });
    },
    // Identify unused local variables (variables that are not exported and not referenced)
    VariableDeclarator(pathNode) {
      const id = pathNode.node.id;
      if (id.type === 'Identifier') {
        const localName = id.name;
        const binding = pathNode.scope.getBinding(localName);
        
        if (
          binding && 
          !binding.referenced && 
          binding.kind !== 'hoisted' && 
          pathNode.parentPath.parent.type !== 'ExportNamedDeclaration' && 
          pathNode.parentPath.parent.type !== 'ExportDefaultDeclaration'
        ) {
          unusedVariables.push(localName);
        }
      }
    }
  });

  if (unusedImports.length > 0) {
    // Group unused imports by their parent ImportDeclaration node
    const declarationsToModify = new Map();
    unusedImports.forEach(({ localName, specifierPath, declarationPath }) => {
      const node = declarationPath.node;
      if (!declarationsToModify.has(node)) {
        declarationsToModify.set(node, {
          path: declarationPath,
          unusedSpecifiers: []
        });
      }
      declarationsToModify.get(node).unusedSpecifiers.push(specifierPath);
    });

    let newCode = code;
    // Sort declarations by start character index in descending order to prevent character offset shifting
    const sortedDeclarations = Array.from(declarationsToModify.entries()).sort((a, b) => b[0].start - a[0].start);

    sortedDeclarations.forEach(([node, { path: declPath, unusedSpecifiers }]) => {
      const allSpecifiers = node.specifiers;
      const unusedNames = unusedSpecifiers.map(s => s.local.name);
      const remainingSpecifiers = allSpecifiers.filter(spec => !unusedNames.includes(spec.local.name));

      const { start, end } = node;

      if (remainingSpecifiers.length === 0) {
        // Remove the entire import statement line
        let replacementEnd = end;
        if (newCode[end] === '\n') {
          replacementEnd = end + 1;
        } else if (newCode[end] === '\r' && newCode[end + 1] === '\n') {
          replacementEnd = end + 2;
        }
        newCode = newCode.slice(0, start) + newCode.slice(replacementEnd);
      } else {
        // Regenerate this specific import statement with remaining specifiers
        const clonedNode = JSON.parse(JSON.stringify(node));
        clonedNode.specifiers = remainingSpecifiers;
        
        const generated = generate(clonedNode, { retainLines: true }, code);
        newCode = newCode.slice(0, start) + generated.code + newCode.slice(end);
      }
    });

    fs.writeFileSync(file, newCode, 'utf8');
    const relativePath = path.relative(__dirname, file);
    console.log(`✨ Cleaned: ${relativePath}`);
    console.log(`   Removed: ${unusedImports.map(u => u.localName).join(', ')}`);
    if (unusedVariables.length > 0) {
      console.log(`   Unused local variables found (not auto-removed): ${Array.from(new Set(unusedVariables)).join(', ')}`);
    }
    totalUnusedImports += unusedImports.length;
    modifiedFilesCount++;
  }
});

console.log(`\n🎉 Cleanup Scan Completed!`);
console.log(`📁 Files modified: ${modifiedFilesCount}`);
console.log(`🧹 Unused imports removed: ${totalUnusedImports}`);

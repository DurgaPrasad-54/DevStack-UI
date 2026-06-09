const fs = require('fs');
const path = require('path');

const SRC_DIR = path.join(__dirname, 'src');

// Files to delete (CRA specific)
const FILES_TO_DELETE = [
  path.join(__dirname, 'public', 'index.html'),
  path.join(SRC_DIR, 'reportWebVitals.js'),
  path.join(SRC_DIR, 'setupTests.js'),
  path.join(SRC_DIR, 'App.test.js')
];

// Helper to check if file content looks like JSX
function isJsxFile(content) {
  // Checks for JSX elements like <div, <Button, <App, <ActiveSectionContext.Provider
  // We match closing tags, self-closing tags, uppercase tags, standard HTML tags, and className attributes.
  const hasClosingTag = /<\/[A-Za-z0-9_.-]+>/.test(content);
  const hasSelfClosing = /<[A-Za-z0-9_.-]+[^>]*?\s*\/>/.test(content);
  const hasClassName = /className=/.test(content);
  const hasUppercaseTag = /<[A-Z][A-Za-z0-9_.-]*(\s|>|\/)/.test(content);
  const hasHtmlTag = /<(div|span|p|a|li|ul|ol|h[1-6]|button|input|form|label|img|section|header|footer|nav|select|option)(\s|>|\/)/i.test(content);
  
  return hasClosingTag || hasSelfClosing || hasClassName || hasUppercaseTag || hasHtmlTag;
}

// Recurse directory
function processDirectory(dir) {
  const files = fs.readdirSync(dir);

  files.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);

    if (stat.isDirectory()) {
      processDirectory(filePath);
    } else if (stat.isFile() && file.endsWith('.js')) {
      // Skip files that are meant to be deleted
      if (FILES_TO_DELETE.includes(filePath)) {
        return;
      }
      
      const content = fs.readFileSync(filePath, 'utf8');
      
      if (isJsxFile(content)) {
        const newFilePath = filePath.slice(0, -3) + '.jsx';
        console.log(`Renaming: ${path.relative(__dirname, filePath)} -> ${path.relative(__dirname, newFilePath)}`);
        
        // Rename file
        fs.renameSync(filePath, newFilePath);
      }
    }
  });
}

console.log('--- Starting Vite + JSX Migration Helper ---');

// 1. Delete CRA specific files
console.log('\nCleaning up legacy CRA files...');
FILES_TO_DELETE.forEach(file => {
  if (fs.existsSync(file)) {
    console.log(`Deleting: ${path.relative(__dirname, file)}`);
    fs.unlinkSync(file);
  } else {
    console.log(`Already deleted or not found: ${path.relative(__dirname, file)}`);
  }
});

// 2. Scan and rename JSX files
console.log('\nScanning and renaming JSX files...');
if (fs.existsSync(SRC_DIR)) {
  processDirectory(SRC_DIR);
} else {
  console.error('src directory not found!');
}

console.log('\n--- Migration Helper Finished Successfully ---');
console.log('Please run the following commands next:');
console.log('1. npm install');
console.log('2. npm run dev');

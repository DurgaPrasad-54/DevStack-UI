const fs = require('fs');
const path = require('path');

const srcDir = path.join(__dirname, 'src');

// Helper to recursively get all files
function getFiles(dir) {
  let results = [];
  if (!fs.existsSync(dir)) return results;
  const list = fs.readdirSync(dir);
  list.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    if (stat && stat.isDirectory()) {
      results = results.concat(getFiles(filePath));
    } else {
      results.push(filePath);
    }
  });
  return results;
}

console.log('Scanning files in src...');
const files = getFiles(srcDir);
let renamedCount = 0;

files.forEach(file => {
  if (path.extname(file) === '.js') {
    const content = fs.readFileSync(file, 'utf8');
    
    // Check if the file contains JSX (basic heuristic: imports React or contains HTML tags/JSX/props)
    const hasJSX = content.includes('React') || 
                   /<[A-Za-z]/.test(content) || 
                   /className=/.test(content) ||
                   /onClick=/.test(content) ||
                   /return\s*\(\s*</.test(content);
                   
    if (hasJSX) {
      const newFile = file.slice(0, -3) + '.jsx';
      console.log(`Renaming: ${path.relative(__dirname, file)} -> ${path.relative(__dirname, newFile)}`);
      fs.renameSync(file, newFile);
      renamedCount++;
    }
  }
});

console.log(`Renamed ${renamedCount} files to .jsx.`);

// Delete CRA specific files if they exist
const filesToDelete = [
  path.join(__dirname, 'public', 'index.html'),
  path.join(__dirname, 'src', 'reportWebVitals.js'),
  path.join(__dirname, 'src', 'setupTests.js'),
  path.join(__dirname, 'src', 'App.test.js')
];

filesToDelete.forEach(file => {
  if (fs.existsSync(file)) {
    console.log(`Deleting legacy CRA file: ${path.relative(__dirname, file)}`);
    fs.unlinkSync(file);
  }
});

console.log('Migration script complete!');

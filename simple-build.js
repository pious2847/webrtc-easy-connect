const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('Starting simple build process...');

try {
  // Run TypeScript compiler
  console.log('Running TypeScript compiler...');
  execSync('npx tsc', { stdio: 'inherit' });
  console.log('TypeScript compilation completed');
  
  // Create dist/worklets directory if it doesn't exist
  const workletDir = path.join('dist', 'worklets');
  if (!fs.existsSync(workletDir)) {
    fs.mkdirSync(workletDir, { recursive: true });
    console.log(`Created directory: ${workletDir}`);
  }
  
  // Copy worklet files
  const workletFiles = [
    'noise-suppression-processor.js',
    'pitch-shift-processor.js'
  ];
  
  workletFiles.forEach(file => {
    const src = path.join('src', 'core', 'media', 'worklets', file);
    const dest = path.join(workletDir, file);
    
    if (fs.existsSync(src)) {
      fs.copyFileSync(src, dest);
      console.log(`Copied ${file}`);
    } else {
      console.error(`Worklet file not found: ${src}`);
    }
  });
  
  console.log('Build completed successfully!');
} catch (error) {
  console.error('Build failed:', error.message);
  process.exit(1);
}

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('Starting simple publish process...');

try {
  // Run the simplified build
  console.log('Building the package...');
  execSync('node build-simplified.js', { stdio: 'inherit' });
  
  // Publish to npm
  console.log('Publishing to npm...');
  execSync('npm publish', { stdio: 'inherit' });
  
  console.log('Package published successfully!');
} catch (error) {
  console.error('Publish failed:', error.message);
  process.exit(1);
}

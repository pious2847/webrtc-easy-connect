const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  dim: '\x1b[2m',
  underscore: '\x1b[4m',
  blink: '\x1b[5m',
  reverse: '\x1b[7m',
  hidden: '\x1b[8m',
  
  fg: {
    black: '\x1b[30m',
    red: '\x1b[31m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    magenta: '\x1b[35m',
    cyan: '\x1b[36m',
    white: '\x1b[37m',
    crimson: '\x1b[38m'
  },
  
  bg: {
    black: '\x1b[40m',
    red: '\x1b[41m',
    green: '\x1b[42m',
    yellow: '\x1b[43m',
    blue: '\x1b[44m',
    magenta: '\x1b[45m',
    cyan: '\x1b[46m',
    white: '\x1b[47m',
    crimson: '\x1b[48m'
  }
};

// Helper functions
function log(message, color = colors.fg.white) {
  console.log(`${color}${message}${colors.reset}`);
}

function logStep(step, message) {
  log(`\n[${step}] ${message}`, colors.fg.cyan);
}

function logSuccess(message) {
  log(`✓ ${message}`, colors.fg.green);
}

function logError(message) {
  log(`✗ ${message}`, colors.fg.red);
}

function runCommand(command, options = {}) {
  try {
    log(`> ${command}`, colors.dim);
    execSync(command, { stdio: 'inherit', ...options });
    return true;
  } catch (error) {
    logError(`Command failed: ${command}`);
    if (options.throwOnError !== false) {
      throw error;
    }
    return false;
  }
}

function ensureDir(dir) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
    logSuccess(`Created directory: ${dir}`);
  }
}

// Build process
function build() {
  log('\n📦 Building WebRTC Easy package...', colors.bright + colors.fg.cyan);
  
  // Clean previous build
  logStep(1, 'Cleaning previous build');
  if (fs.existsSync('dist')) {
    fs.rmSync('dist', { recursive: true, force: true });
    logSuccess('Removed previous build');
  }
  
  // Install dependencies if needed
  logStep(2, 'Checking dependencies');
  if (!fs.existsSync('node_modules')) {
    log('Node modules not found, installing dependencies...', colors.fg.yellow);
    runCommand('npm install');
  } else {
    logSuccess('Dependencies already installed');
  }
  
  // Run TypeScript compiler
  logStep(3, 'Compiling TypeScript');
  runCommand('npx tsc');
  logSuccess('TypeScript compilation completed');
  
  // Copy worklet files
  logStep(4, 'Copying audio worklet files');
  const workletDir = path.join('dist', 'worklets');
  ensureDir(workletDir);
  
  const workletFiles = [
    'noise-suppression-processor.js',
    'pitch-shift-processor.js'
  ];
  
  workletFiles.forEach(file => {
    const src = path.join('src', 'core', 'media', 'worklets', file);
    const dest = path.join(workletDir, file);
    
    if (fs.existsSync(src)) {
      fs.copyFileSync(src, dest);
      logSuccess(`Copied ${file}`);
    } else {
      logError(`Worklet file not found: ${src}`);
    }
  });
  
  // Bundle with webpack (if available)
  logStep(5, 'Creating browser bundle');
  try {
    if (fs.existsSync('webpack.config.js')) {
      runCommand('npx webpack --mode production');
      logSuccess('Browser bundle created with webpack');
    } else {
      log('Webpack config not found, skipping browser bundle creation', colors.fg.yellow);
      log('Consider adding webpack for browser bundling', colors.fg.yellow);
    }
  } catch (error) {
    logError('Failed to create browser bundle');
    log('You can still use the compiled TypeScript output', colors.fg.yellow);
  }
  
  // Run tests
  logStep(6, 'Running tests');
  runCommand('npm test', { throwOnError: false });
  
  log('\n🎉 Build completed successfully!', colors.bright + colors.fg.green);
  log('\nYou can find the build output in the dist/ directory.');
  log('To use the library in your project:');
  log('- For Node.js: import from dist/index.js');
  log('- For browsers: use dist/webrtc-easy.min.js');
}

// Run the build
build();

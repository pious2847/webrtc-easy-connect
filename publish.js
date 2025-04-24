const { execSync } = require('child_process');
const readline = require('readline');
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

// Create readline interface
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Ask a question and return the answer
function ask(question) {
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      resolve(answer);
    });
  });
}

// Main publish function
async function publish() {
  log('\n📦 Publishing WebRTC Easy package to npm...', colors.bright + colors.fg.cyan);
  
  // Check if user is logged in to npm
  logStep(1, 'Checking npm login status');
  try {
    execSync('npm whoami', { stdio: 'pipe' });
    logSuccess('You are logged in to npm');
  } catch (error) {
    logError('You are not logged in to npm');
    log('Please login to npm first:', colors.fg.yellow);
    log('npm login', colors.fg.white);
    rl.close();
    return;
  }
  
  // Check if package.json exists
  logStep(2, 'Checking package.json');
  if (!fs.existsSync('package.json')) {
    logError('package.json not found');
    rl.close();
    return;
  }
  
  // Read package.json
  const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
  const currentVersion = packageJson.version;
  log(`Current version: ${currentVersion}`, colors.fg.green);
  
  // Ask for version bump type
  logStep(3, 'Choosing version bump');
  log('1. Patch (0.1.0 -> 0.1.1) - Bug fixes', colors.fg.white);
  log('2. Minor (0.1.0 -> 0.2.0) - New features, backward compatible', colors.fg.white);
  log('3. Major (0.1.0 -> 1.0.0) - Breaking changes', colors.fg.white);
  log('4. Custom version', colors.fg.white);
  
  const versionType = await ask('Choose version bump type (1-4): ');
  let newVersion;
  
  switch (versionType) {
    case '1':
      newVersion = 'patch';
      break;
    case '2':
      newVersion = 'minor';
      break;
    case '3':
      newVersion = 'major';
      break;
    case '4':
      newVersion = await ask('Enter custom version (e.g., 1.2.3): ');
      break;
    default:
      logError('Invalid option');
      rl.close();
      return;
  }
  
  // Confirm publishing
  logStep(4, 'Confirmation');
  const confirm = await ask(`Are you sure you want to publish version ${newVersion !== 'patch' && newVersion !== 'minor' && newVersion !== 'major' ? newVersion : `(${newVersion})`} to npm? (y/n): `);
  
  if (confirm.toLowerCase() !== 'y') {
    log('Publishing cancelled', colors.fg.yellow);
    rl.close();
    return;
  }
  
  // Build the package
  logStep(5, 'Building package');
  runCommand('npm run build');
  
  // Update version
  logStep(6, 'Updating version');
  if (newVersion === 'patch' || newVersion === 'minor' || newVersion === 'major') {
    runCommand(`npm version ${newVersion} --no-git-tag-version`);
  } else {
    runCommand(`npm version ${newVersion} --no-git-tag-version --allow-same-version`);
  }
  
  // Read updated package.json
  const updatedPackageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
  const updatedVersion = updatedPackageJson.version;
  log(`Updated version: ${updatedVersion}`, colors.fg.green);
  
  // Update CHANGELOG.md
  logStep(7, 'Updating CHANGELOG.md');
  const changelogPath = path.join(__dirname, 'CHANGELOG.md');
  if (fs.existsSync(changelogPath)) {
    const changelog = fs.readFileSync(changelogPath, 'utf8');
    const today = new Date().toISOString().split('T')[0];
    
    // Add new version entry
    const newEntry = `## [${updatedVersion}] - ${today}\n\n### Added\n- \n\n### Changed\n- \n\n### Fixed\n- \n\n`;
    
    // Find the position to insert the new entry (after the header)
    const headerEndPos = changelog.indexOf('## [');
    if (headerEndPos !== -1) {
      const updatedChangelog = changelog.slice(0, headerEndPos) + newEntry + changelog.slice(headerEndPos);
      fs.writeFileSync(changelogPath, updatedChangelog);
      logSuccess('CHANGELOG.md updated');
      
      // Open the changelog for editing
      log('Please update the CHANGELOG.md with your changes', colors.fg.yellow);
      const openEditor = await ask('Do you want to open CHANGELOG.md in your default editor? (y/n): ');
      if (openEditor.toLowerCase() === 'y') {
        try {
          if (process.platform === 'win32') {
            runCommand(`start ${changelogPath}`);
          } else if (process.platform === 'darwin') {
            runCommand(`open ${changelogPath}`);
          } else {
            runCommand(`xdg-open ${changelogPath}`);
          }
        } catch (error) {
          logError('Failed to open editor');
        }
        
        // Wait for user to finish editing
        await ask('Press Enter when you have finished editing the CHANGELOG.md...');
      }
    } else {
      logError('Failed to update CHANGELOG.md');
    }
  } else {
    logError('CHANGELOG.md not found');
  }
  
  // Publish to npm
  logStep(8, 'Publishing to npm');
  const publishCommand = await ask('Do you want to publish with a tag? (leave empty for latest, or enter tag name): ');
  
  if (publishCommand.trim() === '') {
    runCommand('npm publish');
  } else {
    runCommand(`npm publish --tag ${publishCommand.trim()}`);
  }
  
  logSuccess('Package published to npm!');
  log(`Package: ${packageJson.name}@${updatedVersion}`, colors.fg.green);
  
  // Commit changes
  logStep(9, 'Committing changes');
  const commitChanges = await ask('Do you want to commit the version changes to git? (y/n): ');
  
  if (commitChanges.toLowerCase() === 'y') {
    runCommand('git add package.json package-lock.json CHANGELOG.md');
    runCommand(`git commit -m "chore: bump version to ${updatedVersion}"`);
    
    // Create git tag
    const createTag = await ask('Do you want to create a git tag for this version? (y/n): ');
    if (createTag.toLowerCase() === 'y') {
      runCommand(`git tag v${updatedVersion}`);
      
      // Push changes
      const pushChanges = await ask('Do you want to push the changes and tags to the remote repository? (y/n): ');
      if (pushChanges.toLowerCase() === 'y') {
        runCommand('git push');
        runCommand('git push --tags');
        logSuccess('Changes pushed to remote repository');
      }
    }
  }
  
  log('\n🎉 Publishing process completed!', colors.bright + colors.fg.green);
  rl.close();
}

// Run the publish function
publish().catch((error) => {
  logError(`An error occurred: ${error.message}`);
  rl.close();
});

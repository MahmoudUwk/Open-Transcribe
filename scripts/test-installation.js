#!/usr/bin/env node

const { spawn } = require('child_process');
const path = require('path');
const os = require('os');
const fs = require('fs');

const platform = os.platform();
const packageDir = path.resolve(__dirname, '..');

console.log('🧪 Open-Transcribe Installation Test');
console.log('===================================');
console.log('');

function checkFile(filePath, description) {
    const exists = fs.existsSync(filePath);
    console.log(`${exists ? '✅' : '❌'} ${description}: ${filePath}`);
    return exists;
}

function checkCommand(command) {
    return new Promise((resolve) => {
        const child = spawn('which', [command], { stdio: 'pipe' });
        child.on('close', (code) => {
            resolve(code === 0);
        });
    });
}

async function main() {
    console.log(`🖥️ Platform: ${platform}`);
    console.log(`📁 Package directory: ${packageDir}`);
    console.log('');
    
    // Check main files
    console.log('📋 Checking main files...');
    checkFile(path.join(packageDir, 'package.json'), 'package.json');
    checkFile(path.join(packageDir, 'bin', 'open-transcribe'), 'Main executable');
    checkFile(path.join(packageDir, 'src', 'main.py'), 'Python main script');
    checkFile(path.join(packageDir, 'requirements.txt'), 'Python requirements');
    
    console.log('');
    
    // Check setup completion
    console.log('⚙️ Checking setup status...');
    const setupMarker = path.join(packageDir, '.open-transcribe-setup-complete');
    const isSetUp = checkFile(setupMarker, 'Setup marker');
    
    console.log('');
    
    // Check Python environment
    console.log('🐍 Checking Python environment...');
    const python3Available = await checkCommand('python3');
    const pipAvailable = await checkCommand('pip3') || await checkCommand('pip');
    
    console.log(`${python3Available ? '✅' : '❌'} Python 3`);
    console.log(`${pipAvailable ? '✅' : '❌'} pip`);
    
    if (platform === 'linux' || platform === 'darwin') {
        const venvPython = path.join(packageDir, 'linux', '.venv', 'bin', 'python');
        const hasVenv = checkFile(venvPython, 'Virtual environment Python');
        
        const builtExe = path.join(packageDir, 'linux', 'dist', 'OpenTranscribe', 'OpenTranscribe');
        const hasBuiltExe = checkFile(builtExe, 'Built executable');
    }
    
    console.log('');
    
    // Check desktop integration (Linux only)
    if (platform === 'linux' || platform === 'darwin') {
        console.log('🖥️ Checking desktop integration...');
        const homeDir = os.homedir();
        const desktopFile = path.join(homeDir, '.local', 'share', 'applications', 'open-transcribe.desktop');
        const iconFile = path.join(homeDir, '.local', 'share', 'icons', 'open-transcribe.png');
        
        checkFile(desktopFile, 'Desktop entry');
        checkFile(iconFile, 'Application icon');
    }
    
    console.log('');
    
    // Check audio tools (Linux)
    if (platform === 'linux') {
        console.log('🔊 Checking audio tools...');
        const arecordAvailable = await checkCommand('arecord');
        console.log(`${arecordAvailable ? '✅' : '⚠️'} arecord (ALSA)`);
        
        if (!arecordAvailable) {
            console.log('   Install with: sudo apt install alsa-utils');
        }
    }
    
    console.log('');
    
    // Summary
    if (isSetUp) {
        console.log('🎉 Open-Transcribe appears to be properly installed!');
        console.log('');
        console.log('🚀 Try running: open-transcribe');
    } else {
        console.log('⚠️  Setup is not complete. Run: npm run postinstall');
    }
}

main().catch(console.error);
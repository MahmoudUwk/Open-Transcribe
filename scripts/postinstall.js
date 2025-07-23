#!/usr/bin/env node

const { spawn, exec } = require('child_process');
const path = require('path');
const os = require('os');
const fs = require('fs');

const platform = os.platform();
const packageDir = path.resolve(__dirname, '..');
const setupMarkerFile = path.join(packageDir, '.open-transcribe-setup-complete');

console.log('🎙️ Open-Transcribe Post-Install Setup');
console.log('=====================================');
console.log('');

// Check if already set up
if (fs.existsSync(setupMarkerFile)) {
    console.log('✅ Already set up. Skipping installation.');
    process.exit(0);
}

console.log(`🖥️ Platform detected: ${platform}`);
console.log('');

function runCommand(command, args, options = {}) {
    return new Promise((resolve, reject) => {
        const child = spawn(command, args, {
            stdio: 'inherit',
            ...options
        });
        
        child.on('close', (code) => {
            if (code === 0) {
                resolve();
            } else {
                reject(new Error(`Command failed with code ${code}`));
            }
        });
        
        child.on('error', reject);
    });
}

function checkCommand(command) {
    return new Promise((resolve) => {
        exec(`which ${command}`, (error) => {
            resolve(!error);
        });
    });
}

async function installSystemDependencies() {
    console.log('📦 Checking system dependencies...');
    
    if (platform === 'linux') {
        // Check if required commands are available
        const python3Available = await checkCommand('python3');
        const pipAvailable = await checkCommand('pip3') || await checkCommand('pip');
        
        if (!python3Available) {
            console.log('❌ Python 3 is required but not found.');
            console.log('Please install Python 3:');
            console.log('  Ubuntu/Debian: sudo apt install python3 python3-pip python3-venv');
            console.log('  Fedora:        sudo dnf install python3 python3-pip');
            console.log('  Arch:          sudo pacman -S python python-pip');
            process.exit(1);
        }
        
        if (!pipAvailable) {
            console.log('❌ pip is required but not found.');
            console.log('Please install pip:');
            console.log('  Ubuntu/Debian: sudo apt install python3-pip');
            process.exit(1);
        }
        
        console.log('✅ Python 3 and pip are available');
        
        // Check for audio dependencies
        const arecordAvailable = await checkCommand('arecord');
        if (!arecordAvailable) {
            console.log('⚠️  Warning: arecord not found. Audio recording may not work.');
            console.log('   To fix: sudo apt install alsa-utils');
        } else {
            console.log('✅ Audio tools available');
        }
        
    } else if (platform === 'win32') {
        // Check if Python is available on Windows
        const pythonAvailable = await checkCommand('python') || await checkCommand('python3');
        
        if (!pythonAvailable) {
            console.log('❌ Python is required but not found.');
            console.log('Please install Python from https://python.org');
            process.exit(1);
        }
        
        console.log('✅ Python is available');
    }
}

async function setupPythonEnvironment() {
    console.log('');
    console.log('🐍 Setting up Python environment...');
    
    const linuxDir = path.join(packageDir, 'linux');
    
    if (platform === 'linux' || platform === 'darwin') {
        // Create virtual environment
        try {
            console.log('Creating virtual environment...');
            await runCommand('python3', ['-m', 'venv', '.venv'], { cwd: linuxDir });
            console.log('✅ Virtual environment created');
            
            // Install requirements
            console.log('Installing Python dependencies...');
            const venvPip = path.join(linuxDir, '.venv', 'bin', 'pip');
            const requirementsPath = path.join(packageDir, 'requirements.txt');
            
            await runCommand(venvPip, ['install', '--upgrade', 'pip'], { cwd: linuxDir });
            await runCommand(venvPip, ['install', '-r', requirementsPath], { cwd: linuxDir });
            console.log('✅ Python dependencies installed');
            
        } catch (error) {
            console.log('❌ Failed to set up Python environment:', error.message);
            console.log('');
            console.log('💡 Manual setup instructions:');
            console.log(`   cd ${linuxDir}`);
            console.log('   python3 -m venv .venv');
            console.log('   source .venv/bin/activate');
            console.log('   pip install -r ../requirements.txt');
            process.exit(1);
        }
    } else if (platform === 'win32') {
        // Install requirements globally on Windows (or use existing environment)
        try {
            console.log('Installing Python dependencies...');
            const requirementsPath = path.join(packageDir, 'requirements.txt');
            await runCommand('pip', ['install', '-r', requirementsPath]);
            console.log('✅ Python dependencies installed');
        } catch (error) {
            try {
                // Try with pip3
                await runCommand('pip3', ['install', '-r', requirementsPath]);
                console.log('✅ Python dependencies installed');
            } catch (error2) {
                console.log('❌ Failed to install Python dependencies:', error2.message);
                console.log('');
                console.log('💡 Manual setup:');
                console.log(`   pip install -r ${requirementsPath}`);
                process.exit(1);
            }
        }
    }
}

async function buildExecutable() {
    console.log('');
    console.log('🔧 Building executable...');
    
    if (platform === 'linux' || platform === 'darwin') {
        const linuxDir = path.join(packageDir, 'linux');
        const buildScript = path.join(linuxDir, 'build.sh');
        
        if (fs.existsSync(buildScript)) {
            try {
                console.log('Building Linux executable...');
                await runCommand('bash', [buildScript], { cwd: linuxDir });
                console.log('✅ Executable built successfully');
            } catch (error) {
                console.log('⚠️ Failed to build executable, will use Python fallback');
                console.log('Error:', error.message);
            }
        }
    }
    // Windows executable should already be included
}

async function createDesktopIntegration() {
    if (platform === 'linux' || platform === 'darwin') {
        console.log('');
        console.log('🖥️ Creating desktop integration...');
        
        const homeDir = os.homedir();
        const desktopDir = path.join(homeDir, '.local', 'share', 'applications');
        const iconDir = path.join(homeDir, '.local', 'share', 'icons');
        
        try {
            // Create directories
            fs.mkdirSync(desktopDir, { recursive: true });
            fs.mkdirSync(iconDir, { recursive: true });
            
            // Copy icon
            const iconSrc = path.join(packageDir, 'app.png');
            const iconDst = path.join(iconDir, 'open-transcribe.png');
            if (fs.existsSync(iconSrc)) {
                fs.copyFileSync(iconSrc, iconDst);
            }
            
            // Create desktop entry
            const desktopEntry = `[Desktop Entry]
Version=1.0
Type=Application
Name=Open-Transcribe
Comment=AI-Powered Audio Transcription
Exec=${path.join(packageDir, 'bin', 'open-transcribe')}
Icon=${iconDst}
Terminal=false
StartupNotify=true
Categories=AudioVideo;Audio;Recorder;Office;
Keywords=transcription;audio;voice;recording;AI;speech;
`;
            
            const desktopFile = path.join(desktopDir, 'open-transcribe.desktop');
            fs.writeFileSync(desktopFile, desktopEntry);
            fs.chmodSync(desktopFile, 0o755);
            
            console.log('✅ Desktop integration created');
            
            // Update desktop database if available
            try {
                await runCommand('update-desktop-database', [desktopDir]);
            } catch (e) {
                // Ignore if update-desktop-database is not available
            }
            
        } catch (error) {
            console.log('⚠️ Failed to create desktop integration:', error.message);
        }
    }
}

async function main() {
    try {
        await installSystemDependencies();
        await setupPythonEnvironment();
        await buildExecutable();
        await createDesktopIntegration();
        
        // Mark as set up
        fs.writeFileSync(setupMarkerFile, `Setup completed on ${new Date().toISOString()}\n`);
        
        console.log('');
        console.log('🎉 Setup completed successfully!');
        console.log('');
        console.log('🚀 You can now run Open-Transcribe with:');
        console.log('   open-transcribe');
        console.log('');
        console.log('💡 First run will require a Gemini API key (free at https://aistudio.google.com/)');
        
    } catch (error) {
        console.error('❌ Setup failed:', error.message);
        console.log('');
        console.log('Please check the requirements and try again.');
        process.exit(1);
    }
}

// Only run if called directly
if (require.main === module) {
    main();
}

module.exports = { main };
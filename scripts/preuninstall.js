#!/usr/bin/env node

const path = require('path');
const os = require('os');
const fs = require('fs');

const platform = os.platform();
const packageDir = path.resolve(__dirname, '..');
const setupMarkerFile = path.join(packageDir, '.open-transcribe-setup-complete');

console.log('🗑️ Open-Transcribe Uninstall Cleanup');
console.log('====================================');
console.log('');

function removeDesktopIntegration() {
    if (platform === 'linux' || platform === 'darwin') {
        console.log('🖥️ Removing desktop integration...');
        
        const homeDir = os.homedir();
        const desktopFile = path.join(homeDir, '.local', 'share', 'applications', 'open-transcribe.desktop');
        const iconFile = path.join(homeDir, '.local', 'share', 'icons', 'open-transcribe.png');
        
        try {
            // Remove desktop entry
            if (fs.existsSync(desktopFile)) {
                fs.unlinkSync(desktopFile);
                console.log('✅ Desktop entry removed');
            }
            
            // Remove icon
            if (fs.existsSync(iconFile)) {
                fs.unlinkSync(iconFile);
                console.log('✅ Icon removed');
            }
            
        } catch (error) {
            console.log('⚠️ Some files could not be removed:', error.message);
        }
    }
}

function cleanupFiles() {
    console.log('🧹 Cleaning up setup files...');
    
    try {
        // Remove setup marker
        if (fs.existsSync(setupMarkerFile)) {
            fs.unlinkSync(setupMarkerFile);
        }
        
        console.log('✅ Cleanup completed');
        
    } catch (error) {
        console.log('⚠️ Some cleanup failed:', error.message);
    }
}

function showConfigInfo() {
    console.log('');
    console.log('📝 Note: Your configuration and API keys are preserved in:');
    
    if (platform === 'win32') {
        const configDir = path.join(os.homedir(), 'AppData', 'Roaming', 'OpenTranscribe');
        console.log(`   ${configDir}`);
    } else {
        const configDir = path.join(os.homedir(), '.config', 'OpenTranscribe');
        console.log(`   ${configDir}`);
    }
    
    console.log('');
    console.log('To remove configuration completely:');
    
    if (platform === 'win32') {
        console.log('   rmdir /s "%APPDATA%\\OpenTranscribe"');
    } else {
        console.log('   rm -rf ~/.config/OpenTranscribe');
    }
}

function main() {
    try {
        removeDesktopIntegration();
        cleanupFiles();
        showConfigInfo();
        
        console.log('');
        console.log('👋 Open-Transcribe has been uninstalled.');
        console.log('Thank you for using Open-Transcribe!');
        
    } catch (error) {
        console.error('❌ Uninstall cleanup failed:', error.message);
        process.exit(1);
    }
}

// Only run if called directly
if (require.main === module) {
    main();
}

module.exports = { main };
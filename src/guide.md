# 🚀 Building Open-Transcribe

Quick guide to build the Open-Transcribe application into a standalone executable and Windows installer.

## 📋 Prerequisites

Ensure you have these installed:
- ✅ **Python 3.8+** with pip
- ✅ **PyInstaller** (`pip install pyinstaller`)
- ✅ **Inno Setup Compiler** ([Download here](https://jrsoftware.org/isinfo.php))

## 🔨 Build Process

### Step 1: Create Executable

Run this command from the project root:

```powershell
# Activate virtual environment and build executable
.\.venv\Scripts\Activate.ps1; pyinstaller --onefile --windowed --name OpenTranscribe --distpath src/dist --workpath src/build src/main.py
```

**What this does:**
- `--onefile`: Creates a single executable file
- `--windowed`: Hides the console window (GUI app)
- `--name OpenTranscribe`: Names the executable "OpenTranscribe.exe"
- `--distpath src/dist`: Output directory
- `--workpath src/build`: Temporary build files

**Output:** `src/dist/OpenTranscribe.exe`

### Step 2: Create Windows Installer

Run the Inno Setup compiler:

```powershell
# Build installer (adjust path if Inno Setup is installed elsewhere)
"C:\Program Files (x86)\Inno Setup 6\ISCC.exe" src\OpenTranscribeInstaller.iss
```

**Output:** `Windows_installer/OpenTranscribeSetup.exe`

## 📁 Final Structure

After building, you'll have:
```
Easy_transcribe/
├── src/
│   ├── dist/
│   │   └── OpenTranscribe.exe          # Standalone executable
│   └── build/                          # Temporary build files
└── Windows_installer/
    └── OpenTranscribeSetup.exe         # Windows installer
```

## 🎯 Quick Build Script

For convenience, you can run both steps together:

```powershell
# Build executable and installer in one go
.\.venv\Scripts\Activate.ps1; pyinstaller --onefile --windowed --name OpenTranscribe --distpath src/dist --workpath src/build src/main.py; "C:\Program Files (x86)\Inno Setup 6\ISCC.exe" src\OpenTranscribeInstaller.iss
```

## 🔧 Troubleshooting

- **Missing modules error**: Add `--hidden-import module_name` to PyInstaller command
- **Inno Setup not found**: Verify the installation path in the command
- **Permission denied**: Run PowerShell as Administrator 
# Building Open-Transcribe Executables and Installer

This guide outlines the steps to build the Open-Transcribe application into a standalone executable and then create a Windows installer using PyInstaller and Inno Setup.

## Prerequisites

Make sure you have the following installed:

```bash
✅ Python 3.x
✅ pip (Python package manager)
✅ PyInstaller (for executable builds)
✅ Inno Setup Compiler (for Windows installer)
```

## 1. Build Executable with PyInstaller

This step converts your Python script (`main.py`) into a single executable file.

```bash
pyinstaller --onefile src/main.py --distpath src/dist --workpath src/build
```

- `--onefile`: Packages the application into a single executable file.
- `src/main.py`: The main Python script of your application.
- `--distpath src/dist`: Specifies the directory where the executable will be placed (output).
- `--workpath src/build`: Specifies the directory where PyInstaller stores its temporary working files.

After running this command, you will find the `main.exe` (or `main` if on Linux/macOS) in the `src/dist` directory.

## 2. Create Windows Installer with Inno Setup

This step uses the Inno Setup Compiler and the `.iss` script to create a user-friendly installer for your Windows application.

```bash
"C:\Program Files (x86)\Inno Setup 6\ISCC.exe" src\OpenTranscribeInstaller.iss
```

- `"C:\Program Files (x86)\Inno Setup 6\ISCC.exe"`: This is the typical default installation path for the Inno Setup Compiler executable. **Ensure this path matches your Inno Setup installation.**
- `src\OpenTranscribeInstaller.iss`: This is the Inno Setup Script file that contains all the instructions for building your installer (e.g., application name, version, files to include, installation directories, etc.).

After running this command, the `OpenTranscribeSetup.exe` installer will be generated. Its location is defined within the `OpenTranscribeInstaller.iss` script, but it is typically placed in the `Windows_installer/` directory. 
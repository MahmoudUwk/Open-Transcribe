# 🚀 Quick Build Guide

## 🔧 Prerequisites
- Python 3.8+ with pip
- PyInstaller (`pip install pyinstaller`)
- Inno Setup (for Windows installer)

## 🛠️ Build Steps

1. **Build the executable**
   ```powershell
.venv\Scripts\pyinstaller.exe --onedir --windowed --name OpenTranscribe --distpath src/dist --workpath src/build src/main.py
   ```
   
2. **Create Windows Installer**
   ```powershell
   "C:\Program Files (x86)\Inno Setup 6\ISCC.exe" src\OpenTranscribeInstaller.iss
   ```

💡 The installer will be in `Windows_installer/`

## 🚀 Run Directly
```powershell
python src/main.py
```

## 🔧 Troubleshooting
- **Missing modules**: Add `--hidden-import module_name` to PyInstaller
- **Inno Setup not found**: Check installation path
- **Permission denied**: Run as Administrator
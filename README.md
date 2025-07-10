<div align="center">

# 🎙️ Open-Transcribe

**Transform Your Voice into Text with AI-Powered Precision**

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Platform](https://img.shields.io/badge/Platform-Windows-blue.svg)](https://www.microsoft.com/windows)
[![Python](https://img.shields.io/badge/Python-3.x-green.svg)](https://www.python.org/)
[![Powered by](https://img.shields.io/badge/Powered%20by-Gemini%20AI-orange.svg)](https://ai.google.dev/)

*The ultimate free, open-source speech transcription tool that revolutionizes how you capture and convert spoken words!*

[📥 Download](#-quick--easy-installation) • [🚀 Features](#-why-choose-open-transcribe) • [💻 Build from Source](#-build-from-source) • [📖 Documentation](#-project-structure)

</div>

---

## 🌟 Why Choose Open-Transcribe?

*   **100% Free Forever:** This application is entirely free and open-source, with no hidden costs. The Gemini API key, essential for its function, is also free to obtain, allowing for unlimited transcriptions.

*   **Supercharge Your Productivity:** Streamline your workflow by quickly transcribing meetings, lectures, and interviews. It supports multiple languages to save you significant manual effort.

*   **Privacy First:** Your API key is stored securely on your device and is never transmitted externally. You retain full control over your data, and the application functions offline once set up.

*   **Cutting-Edge Technology:** Leveraging Google's Gemini AI, Open-Transcribe delivers highly accurate, multi-language transcriptions through a user-friendly interface.

---

## 📥 Quick & Easy Installation

### 🎯 **One-Click Install** *(Recommended for Everyone)*

Getting started takes less than 2 minutes! 

1. **📦 Download the Installer**
   ```
   🔗 Get OpenTranscribeSetup.exe from Windows_installer/ directory
   📅 (GitHub releases coming soon!)
   ```

2. **▶️ Run & Install**
   - Double-click the installer
   - Follow the simple setup wizard
   - Launch from Start Menu or Desktop

3. **🔑 Get Your FREE API Key**
   - Visit [🌟 Google AI Studio](https://aistudio.google.com/apikey)
   - Sign in with Google (free account)
   - Generate your API key
   - Paste it into Open-Transcribe

**🎉 That's it! You're ready to transcribe!**

---

## 🛠️ Build from Source

Perfect for developers, contributors, and customization enthusiasts!

### 📋 Prerequisites

```bash
✅ Python 3.x
✅ pip (Python package manager)
✅ PyInstaller (for executable builds)
✅ Inno Setup Compiler (for Windows installer)
```

### 🚀 Quick Start

```bash
# 📁 Clone the repository
git clone https://github.com/MahmoudUwk/Open-Transcribe.git
cd Open-Transcribe

# 🌐 Create virtual environment (recommended)
python -m venv .venv
.venv\Scripts\activate

# 📦 Install dependencies
pip install -r requirements.txt

# 🏃‍♂️ Run the application
python src/main.py
```

### 🔨 Building Your Own Installer

Want to create a custom build? Here's how:

1. **🎯 Build Executable**
   ```bash
   pyinstaller --onefile src/main.py --distpath src/dist --workpath src/build
   ```

2. **📦 Create Windows Installer**
   ```bash
   # Using Inno Setup Compiler
   "C:\Program Files (x86)\Inno Setup 6\ISCC.exe" src\OpenTranscribeInstaller.iss
   ```

---

## 📁 Project Structure

```
Open-Transcribe/
├── 📂 src/
│   ├── 🐍 main.py                     # Main application
│   └── 📜 OpenTranscribeInstaller.iss # Installer script
├── 📂 Windows_installer/
│   └── 💾 OpenTranscribeSetup.exe     # Ready-to-use installer
├── 📄 requirements.txt               # Python dependencies
├── 📋 README.md                      # You are here!
└── 📜 LICENSE                        # MIT License
```

---

## 🤝 Contributing

We love contributions! Here's how you can help make Open-Transcribe even better:

- 🐛 **Report bugs** - Found an issue? Let us know!
- 💡 **Suggest features** - Have an idea? We'd love to hear it!
- 🔧 **Submit pull requests** - Ready to contribute code?
- 📖 **Improve documentation** - Help others understand the project
- ⭐ **Star the repository** - Show your support!

---

## 📄 License

This project is proudly licensed under the **MIT License** - see the [LICENSE](LICENSE) file for details.

**Translation:** You can use, modify, and distribute this software freely! 🎉

---

<div align="center">

**🚀 Ready to transform your voice into text?**

[Download Open-Transcribe Now](#-quick--easy-installation) and experience the future of speech transcription!

**Made with ❤️ by the Open-Transcribe community**

*Don't forget to ⭐ star this repository if you find it useful!*

</div>
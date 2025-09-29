<div align="center">

# 🎙️ Open-Transcribe

**Transform Your Voice into Text with AI-Powered Precision**

## 🚀 What's New in v1.2.8

**We've supercharged your transcription experience!** 🎉

- 🧩 **Cross-platform support** – One npm package for Windows & Linux
- 📝 **Improved UI** – Bigger textbox with layout fixes
- 🐧 **Full Linux support** – With optimized GUI scaling
- 🎯 **Dual modes** – Transcribe or Transcribe + Plan
- 🌍 **Multi-language** – Automatic language detection
- ⚡ **Better performance** – Faster and smoother operation
- 🛠️ **Improved PyAudio handling** – Better error handling and fallbacks

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Platform](https://img.shields.io/badge/Platform-Windows%20%7C%20Linux-blue.svg)](https://www.npmjs.com/package/open-transcribe)
[![Python](https://img.shields.io/badge/Python-3.x-green.svg)](https://www.python.org/)
[![Powered by](https://img.shields.io/badge/Powered%20by-Gemini%20AI-orange.svg)](https://ai.google.dev/)

*Free, open-source desktop app for instant speech-to-text conversion with Google Gemini AI.*

</div>

---

<p align="center">
  <img src="app.png" alt="Open-Transcribe App Screenshot" width="400px">
</p>

---

## 📥 Quick & Easy Installation

### 🐧 Linux Installation (Recommended)

Install globally via npm:
```bash
npm install -g open-transcribe
```

Launch the application:
```bash
open-transcribe
```

**Linux Features:**
- ✅ Optimized GUI scaling
- ✅ ALSA/PulseAudio support
- ✅ Desktop integration
- ✅ Automatic Python setup
- ✅ Cross-platform audio recording

### 🪟 Windows Installation

Install globally via npm. The post-install script will automatically handle Python dependencies.
```bash
npm install -g open-transcribe
```

Launch the application:
```bash
open-transcribe
```

## 🎯 Prompt Options

Open-Transcribe offers two powerful modes to suit your needs:

1. **Transcribe (Autodetect languages)**
   - Produces a verbatim transcription of your audio
   - Automatically detects and transcribes all spoken languages
   - Merges output into a clean, single paragraph

2. **Transcribe and Plan (Add summary/action)**
   - First transcribes the entire recording with language autodetection
   - Then analyzes the transcript to produce a concise summary or action plan
   - Presents the final output with separate "Transcription" and "Plan" sections

## 🌟 Why Choose Open-Transcribe?

*   **100% Free Forever:** Entirely free and open-source with no hidden costs
*   **Seamless Transcription:** Record audio and get instant transcriptions without uploading
*   **Privacy First:** Your API key is stored securely on your device
*   **Cutting-Edge Technology:** Powered by Google's Gemini AI for accurate transcriptions

---

## ⚠️ Disclaimer & Early Development Notice

Open-Transcribe is provided "as-is" and is currently in its early development stages (Version 1.0). While we are committed to providing a reliable and accurate experience and will never intentionally cause loss of your recordings, we cannot guarantee uninterrupted service or the complete absence of unforeseen issues. By using this free software, you acknowledge and agree that the developers are not responsible for any direct, indirect, incidental, special, or consequential damages, or any loss of data or profits, arising out of or in connection with the use or performance of this application. Your use of Open-Transcribe is at your sole risk.

---

## 📥 Quick & Easy Installation

### 🚀 **Cross-Platform Install** *(Recommended)*

**One command installation using npm:**

```bash
npm install -g open-transcribe
```

Then launch with:
```bash
open-transcribe
```

- ✅ On Windows: downloads a prebuilt executable (no Python required)
- ✅ On Linux: downloads a prebuilt executable when available, or builds locally via PyInstaller
- ✅ Creates a desktop entry on Linux (menu entry/shortcut)

### 🐧 **Linux Installation**

Open-Transcribe now has **full Linux support** with optimized GUI scaling for Ubuntu/Debian systems:

```bash
# Install globally via npm
npm install -g open-transcribe

# Launch the application
open-transcribe
```

**Linux Features:**
- ✅ Optimized GUI scaling (1.3x widgets, 1.2x window)
- ✅ ALSA/PulseAudio audio support with fallbacks
- ✅ Desktop integration (.desktop file creation)
- ✅ Automatic Python environment setup
- ✅ Cross-platform audio recording

> Note: The standalone Windows installer has been deprecated. Use the npm installation above for the best experience.

### 🔑 **Get Your FREE API Key (Required for Both Methods)**
   - Visit [🌟 Google AI Studio](https://aistudio.google.com/apikey)
   - Sign in with Google (free account)
   - Generate your API key
   - Paste it into Open-Transcribe (only once at the first launch)


---

## 🛠️ Build from Source

For developers and contributors.

### 📋 Prerequisites

```bash
✅ Python 3.x
```
### 🔨 Build executables locally

Linux/macOS:
```bash
bash linux/build.sh
# Result: dist/linux/open-transcribe
````
Windows (run on Windows):
```powershell
pyinstaller --name open-transcribe --onefile --windowed src/main.py --distpath dist/windows --workpath build --specpath build
# Result: dist/windows/open-transcribe.exe
```

---

## 📁 Project Structure
Open-Transcribe/
├── bin/
│   └── open-transcribe.js            # Cross-platform launcher (npm bin)
├── linux/
│   ├── build.sh                      # Linux build script (PyInstaller)
│   └── run_app.sh                    # Dev helper to run from source
├── scripts/
│   ├── postinstall.js                # Downloads prebuilts or builds locally
│   ├── preuninstall.js               # Cleanup on uninstall
│   └── test-installation.js          # Sanity checks
├── src/
│   └── main.py                       # Main application
├── requirements.txt                  # Python dependencies
├── README.md                         # You are here!
└── LICENSE                           # MIT License
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
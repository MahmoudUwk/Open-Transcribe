# Open-Transcribe 2.0

The Tauri-powered desktop rewrite of Open-Transcribe now lives in the `src/` directory. This root repository hosts project assets, license text, CI configuration, and the modern desktop client source. Version **2.0.0** introduces a fully native experience with packaging support for Linux, Windows, and macOS.

## 📁 Repository layout

- **`src/`** – React/Vite + Tauri desktop application (run `npm install` here)
- **`app.png`** – Product artwork used in documentation/ installers
- **`LICENSE`** – MIT license for the entire project
- **`README.md`** – You are here

The legacy npm CLI package has been retired; all active development targets the Tauri desktop app inside `src/`.

## 🔧 Quick start

```bash
git clone https://github.com/MahmoudUwk/Open-Transcribe.git
cd Open-Transcribe
npm run install          # executes `npm install` inside ./src
npm run tauri:dev        # launches the desktop shell in development mode
```

Root `package.json` scripts simply proxy into `src/`:

- `npm run dev` → `cd src && npm run dev`
- `npm run build` → `cd src && npm run build`
- `npm run tauri:build` → `cd src && npm run tauri build`
- `npm run check` → `cd src && npm run check`

## 📦 Packaging

All packaging logic is defined under `src/src-tauri/` (`tauri.conf.json`, `Cargo.toml`). The bundle targets include `.AppImage`, `.deb`, `.rpm`, `.msi`, `.nsis`, `.app`, and `.dmg`. Generate installers with:

```bash
cd src
npm run tauri build
```

Artifacts appear under `src/src-tauri/target/release/`.

## 📚 Documentation

Detailed developer and user-facing instructions, including platform-specific install commands and Gemini API setup, are in `src/README.md`. Refer to that file for:

- Prerequisites (Node, Rust toolchain, Tauri requirements)
- Local development workflow
- Testing (Vitest, Playwright)
- Packaging / signing guidance
- One-line installers per platform

## ✅ Status

- Tauri workspace version: **2.0.0** (`src/package.json`)
- Production bundle verified: `npm run build` succeeds from both `src/` and repository root
- All previous Python/PyInstaller assets were removed in favor of the Tauri rewrite

## 🤝 Contributing

Pull requests are welcome! Please run `npm run check` (root or inside `src/`) before opening a PR. See `src/README.md` for contribution guidelines and testing instructions.

---

For questions, feature requests, or bug reports, open an issue on GitHub.

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
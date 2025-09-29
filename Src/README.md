# Open-Transcribe (Tauri Edition)

Open-Transcribe is a polished desktop client for AI-powered audio transcription and instruction workflows. This rewrite uses **React + Vite** for the UI and **Tauri** for lightweight cross-platform packaging, delivering fast startup times and native installers for Windows, macOS, and Linux.

## Highlights

- **Multi-step capture flow**: Record audio, review playback inline, and run Gemini prompts with a single click.
- **Inline Gemini uploads**: Audio is sent directly via inline base64 payloads—no temporary hosting required (`src/services/transcriptionClient.ts`).
- **Compact, responsive UI**: Controls, playback, and transcript panels adapt cleanly to small displays.
- **Cross-platform native builds**: Single command (`npm run tauri build`) outputs installers for Windows (`.msi`/`.nsis`), macOS (`.app`/`.dmg`), and Linux (`.AppImage`, `.deb`, `.rpm`).

## Prerequisites

- **Node.js** 20+
- **npm** 10+
- **Rust toolchain** via `rustup` (stable channel, `rustfmt`, `clippy` components)
- **Tauri prerequisites** for each OS: <https://tauri.app/v1/guides/getting-started/prerequisites>
- (Optional) **Playwright** system dependencies for end-to-end tests.

## Local Development

1. **Install dependencies**
   ```bash
   npm install
   ```

2. **Run the web dev server** (hot reload, mock Tauri shell)
   ```bash
   npm run dev
   ```

3. **Launch the Tauri shell in development**
   ```bash
   npm run tauri dev
   ```

## Commands at a Glance

- **Start dev server**: `npm run dev`
- **Run Tauri dev shell**: `npm run tauri dev`
- **Bundle for production**: `npm run build`
- **Package native installers**: `npm run tauri build`
- **Unit tests (Vitest)**: `npm run test`
- **E2E tests (Playwright)**: `npm run test:e2e`
- **Lint + tests**: `npm run check`

## Building & Packaging

### 1. Build the front-end bundle
```bash
npm run build
```

### 2. Produce native installers
```bash
npm run tauri build
```
Artifacts are emitted to `src-tauri/target/release/`:

- **Windows**: `.msi` installer and portable `.exe`/`.msi` (`msi`, `nsis` targets)
- **macOS**: `.app` bundle and `.dmg` disk image (`app`, `dmg` targets)
- **Linux**: `.AppImage`, `.deb`, `.rpm` packages (`appimage`, `deb`, `rpm` targets)

### Code signing & notarization
- **Windows**: Sign `.msi` / `.exe` with an Authenticode certificate to avoid “Unknown Publisher” prompts.
- **macOS**: Use Developer ID for code signing and notarize via Apple to bypass Gatekeeper warnings.
- **Linux**: Optionally sign packages (e.g., `dpkg-sig`, `rpm --addsign`).

## End-User Installation One-Liners

Replace the URLs below with links to your published release assets (e.g. GitHub Releases).

### Windows (PowerShell)
```powershell
Invoke-WebRequest https://example.com/Open-Transcribe-latest.msi -OutFile Open-Transcribe.msi; \
Start-Process msiexec.exe -Wait -ArgumentList '/i Open-Transcribe.msi /qn'
```

### macOS (zsh/bash)
```bash
curl -L https://example.com/Open-Transcribe.dmg -o Open-Transcribe.dmg && \
hdiutil attach Open-Transcribe.dmg && \
cp -R /Volumes/Open-Transcribe/Open-Transcribe.app /Applications && \
hdiutil detach /Volumes/Open-Transcribe
```

### Linux (Debian/Ubuntu)
```bash
curl -L https://example.com/Open-Transcribe.deb -o Open-Transcribe.deb && \
sudo apt install ./Open-Transcribe.deb
```

### Linux (Fedora/RHEL)
```bash
curl -L https://example.com/Open-Transcribe.rpm -o Open-Transcribe.rpm && \
sudo rpm -i Open-Transcribe.rpm
```

### Linux (AppImage)
```bash
curl -L https://example.com/Open-Transcribe.AppImage -o Open-Transcribe.AppImage && \
chmod +x Open-Transcribe.AppImage && \
./Open-Transcribe.AppImage
```

## Automated Releases

- Use **GitHub Actions** with [`tauri-apps/tauri-action`](https://github.com/tauri-apps/tauri-action) to compile installers for all platforms in CI.
- Upload artifacts directly to GitHub Releases; reference their URLs in documentation and one-line installers.
- Configure environment secrets for code signing (Apple, Windows) within CI to produce fully trusted builds.

## Gemini API Access

- Generate a Gemini API key at <https://aistudio.google.com/api-keys>.
- Inside the app, open the **Gemini API** panel, paste the key, and store it securely. A quick-access button (“Get a free Gemini Key”) links directly to the key portal.
- Keys are persisted through the preferences manager so they survive restarts.

## Testing

- **Unit tests**: `npm run test` (Vitest)
- **Watch mode**: `npm run test:watch`
- **End-to-end**: `npm run test:e2e` (ensure Playwright browsers are installed via `npx playwright install`)
- **Lint**: `npm run lint`

## Project Structure

- **`src/`**: React components, hooks, services, and styling
- **`src/services/transcriptionClient.ts`**: Inline Gemini transcription client
- **`src-tauri/`**: Tauri Rust shell and configuration (`tauri.conf.json`)
- **`tests/`**: Unit (`Vitest`) and integration (`Playwright`) tests

## Contributing

- Follow the existing ESLint + Prettier formatting; run `npm run check` before opening a PR.
- Document UI changes with screenshots or loom/gif captures when possible.
- Update this README when deployment or setup instructions change.

---

**Need help?** Open an issue or start a discussion in the repository. Contributions that improve automation, testing, or accessibility are especially welcome.

# Open-Transcribe (Web Edition)

[https://open-transcribe.netlify.app](https://open-transcribe.netlify.app) delivers Open-Transcribe as a browser-based experience. Record audio, run Gemini-powered prompts, and review transcripts directly in the cloud—no desktop install required.

## 🌐 Highlights

- **Instant access**: Works anywhere a modern browser runs (Chrome, Edge, Firefox). Microphone prompts are handled by the browser’s permission system.
- **Gemini-ready**: Paste your Gemini API key once; it’s stored securely in `localStorage` on that device.
- **Responsive UI**: Polished layout optimized for both laptops and smaller screens.
- **Privacy-aware**: Audio is only uploaded when you initiate transcription. Everything else stays in the browser session.

## 📁 Repository Layout

- **`src/`** – React + Vite application source and tests
- **`netlify.toml`** – Netlify build configuration (`npm run build`, publish `src/dist`)
- **`app.png`** – Marketing imagery
- **`LICENSE`** – MIT license

## 🚀 Getting Started (local dev)

```bash
git clone https://github.com/MahmoudUwk/Open-Transcribe.git
cd Open-Transcribe/src
npm install
npm run dev
```

Visit the printed URL (default `http://localhost:5173/`) and allow microphone access when prompted.

## 🛠️ Build for Production

```bash
cd Open-Transcribe/src
npm run build
```

Static assets are emitted to `src/dist/`. Deploy that folder to any static host (Netlify, Vercel, GitHub Pages, Cloudflare Pages, etc.). The Netlify workflow is preconfigured:

- `netlify init` (done) links to Netlify CI/CD.
- `netlify deploy --prod --dir=dist` publishes the latest build.

## 🔐 Storing API Keys

- Each browser profile saves its Gemini key in `localStorage`.
- Users must re-enter the key when switching browsers or devices.
- Consider adding export/import features if you need cross-device sync.

## 🧪 Testing & Linting

```bash
npm run lint
npm run test        # Vitest unit tests
npm run test:e2e    # Playwright smoke tests (install Playwright browsers first)
```

## 🤝 Contributing

- Fork the repo, create a branch, and open a pull request.
- Run `npm run lint` and `npm run test` before submitting.
- UI changes benefit from screenshots or short videos in the PR description.

## 📄 License

Released under the [MIT License](LICENSE). Feel free to remix and build on Open-Transcribe—just keep the notice intact.

---

Share feedback or ideas via GitHub Issues. If the project helps you, a ⭐️ is always appreciated!
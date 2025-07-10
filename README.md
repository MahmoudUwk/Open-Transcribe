# Open-Transcribe

Open-Transcribe is a desktop application that provides an easy way to transcribe speech using the Gemini API. It allows users to record audio and get a transcription in various languages.

## Project Structure

The project is organized into the following directories:

*   **`src/`**: Contains the main application source code (`main.py`), the PyInstaller build artifacts (`build/` and `dist/`), and the Inno Setup script (`OpenTranscribeInstaller.iss`).
*   **`Windows_installer/`**: (Generated after Inno Setup compilation) Contains the final Windows installer (`OpenTranscribeSetup.exe`).

## Installation Options

Choose the installation method that best suits your needs:

### Option 1: Easy Installation (Recommended for End-Users)

This method uses a pre-built Windows installer for a straightforward setup experience.

1.  **Download the installer:** Obtain `OpenTranscribeSetup.exe` from the `Windows_installer/` directory (or a release distribution).
2.  **Run the installer:** Double-click `OpenTranscribeSetup.exe` and follow the on-screen prompts.
3.  **Launch the application:** After installation, launch "Open-Transcribe" from your Start Menu or Desktop shortcut.
4.  **Enter Gemini API Key:** On the first launch, the application will prompt you to enter your Gemini API Key. This key is securely saved locally in a configuration file for future use. **Your API key is stored locally and is never transmitted externally by the application.**

### Option 2: Build from Source (For Developers & Advanced Users)

This method requires Python and build tools to run the application directly from its source code or create your own installer.

#### Prerequisites

*   Python 3.x
*   `pip` (Python package installer)
*   [PyInstaller](https://pyinstaller.org/) (for building the executable)
*   [Inno Setup Compiler](https://jrsoftware.org/isinfo.php) (for creating the Windows installer)

#### Development Setup

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/MahmoudUwk/Open-Transcribe.git
    cd Open-Transcribe
    ```

2.  **Create a virtual environment (recommended):**
    ```bash
    python -m venv .venv
    .venv\Scripts\activate
    ```

3.  **Install dependencies:**
    ```bash
    pip install -r requirements.txt
    ```

#### Building the Application

To create a standalone executable and then a Windows installer:

1.  **Build the executable with PyInstaller:**
    Navigate to the root directory of the project, then run:
    ```bash
    pyinstaller --onefile src/main.py --distpath src/dist --workpath src/build
    ```
    This will generate `main.exe` in the `src/dist/` directory.

2.  **Generate the Windows Installer with Inno Setup:**
    Open the `src/OpenTranscribeInstaller.iss` file using the Inno Setup Compiler GUI and compile it. Alternatively, you can run it from the command line (adjust path to `ISCC.exe` if needed):
    ```bash
    "C:\Program Files (x86)\Inno Setup 6\ISCC.exe" src\OpenTranscribeInstaller.iss
    ```
    The installer executable (`OpenTranscribeSetup.exe`) will be created in the `Windows_installer/` directory at the project root.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
"""
A simple application for recording audio and transcribing it using Google's Gemini API.
"""
import json
import os
import tempfile
import threading
import tkinter as tk
import wave

import customtkinter
import pyaudio
from google import genai


customtkinter.set_appearance_mode("dark")
customtkinter.set_default_color_theme("blue")


def get_app_config_dir():
    """Returns the application's configuration directory based on the OS."""
    if os.name == 'nt':  # Windows
        return os.path.join(os.environ['APPDATA'], 'OpenTranscribe')
    # Linux/macOS
    return os.path.join(os.path.expanduser('~'), '.config', 'OpenTranscribe')


def load_api_key():
    """Loads the Gemini API key from the config file."""
    config_dir = get_app_config_dir()
    config_path = os.path.join(config_dir, 'config.json')
    if os.path.exists(config_path):
        try:
            with open(config_path, 'r', encoding='utf-8') as f:
                config = json.load(f)
                api_key = config.get('GEMINI_API_KEY')
                if not api_key:
                    print("API key not found in config file.")
                return api_key
        except json.JSONDecodeError as e:
            print(f"Error decoding config.json: {e}")
            return None
    return None


def save_api_key(api_key):
    """Saves the Gemini API key to the config file."""
    config_dir = get_app_config_dir()
    os.makedirs(config_dir, exist_ok=True)
    config_path = os.path.join(config_dir, 'config.json')
    if api_key:
        try:
            with open(config_path, 'w', encoding='utf-8') as f:
                json.dump({'GEMINI_API_KEY': api_key}, f)
        except IOError as e:
            print(f"Error saving API key to config.json: {e}")
    else:
        print("API key not provided, not saving.")


# pylint: disable=too-many-instance-attributes
class App(customtkinter.CTk):
    """The main application class for the transcriber."""
    def __init__(self):
        super().__init__()

        self.title("🎙️ Open-Transcribe")
        self.geometry("900x700")
        self.minsize(800, 600)
        
        # Configure grid weights for responsive design
        self.grid_columnconfigure(0, weight=1)
        self.grid_rowconfigure(0, weight=1)

        # Create main container with gradient-like effect
        self.main_container = customtkinter.CTkFrame(self, corner_radius=0)
        self.main_container.grid(row=0, column=0, sticky="nsew")
        self.main_container.grid_columnconfigure(0, weight=1)
        self.main_container.grid_rowconfigure(1, weight=1)

        # Header section
        self.create_header()
        
        # Main content area
        self.create_main_content()
        
        # Footer with status
        self.create_footer()

        # Initialize recording variables
        self.recording = False
        self.audio_frames = []
        self.p_audio = None
        self.stream = None
        self.gemini_client = None
        self.record_thread = None
        self.pulse_animation = None

        self._initialize_client()

    def create_header(self):
        """Creates the header section with title and branding."""
        self.header_frame = customtkinter.CTkFrame(self.main_container, height=80, corner_radius=0)
        self.header_frame.grid(row=0, column=0, sticky="ew", padx=0, pady=0)
        self.header_frame.grid_columnconfigure(1, weight=1)
        
        # App icon/logo
        self.logo_label = customtkinter.CTkLabel(
            self.header_frame, 
            text="🎙️", 
            font=("Arial", 32)
        )
        self.logo_label.grid(row=0, column=0, padx=20, pady=20, sticky="w")
        
        # App title
        self.title_label = customtkinter.CTkLabel(
            self.header_frame,
            text="Open-Transcribe",
            font=("Arial", 24, "bold")
        )
        self.title_label.grid(row=0, column=1, padx=10, pady=20, sticky="w")
        
        # Subtitle
        self.subtitle_label = customtkinter.CTkLabel(
            self.header_frame,
            text="AI-Powered Audio Transcription",
            font=("Arial", 12),
            text_color="gray70"
        )
        self.subtitle_label.grid(row=0, column=2, padx=20, pady=20, sticky="e")

    def create_main_content(self):
        """Creates the main content area."""
        self.content_frame = customtkinter.CTkFrame(self.main_container, corner_radius=15)
        self.content_frame.grid(row=1, column=0, padx=20, pady=10, sticky="nsew")
        self.content_frame.grid_columnconfigure(0, weight=1)
        self.content_frame.grid_rowconfigure(2, weight=1)

        # Control panel
        self.create_control_panel()
        
        # Language selection
        self.create_language_selection()
        
        # Transcription area
        self.create_transcription_area()

    def create_control_panel(self):
        """Creates the control panel with record button and status."""
        self.control_frame = customtkinter.CTkFrame(self.content_frame, height=100)
        self.control_frame.grid(row=0, column=0, padx=20, pady=20, sticky="ew")
        self.control_frame.grid_columnconfigure(1, weight=1)
        
        # Record button with enhanced styling
        self.record_button = customtkinter.CTkButton(
            self.control_frame,
            text="🎤 Start Recording",
            command=self.toggle_record,
            font=("Arial", 16, "bold"),
            height=60,
            width=200,
            corner_radius=30,
            hover_color=("#1f538d", "#14375e")
        )
        self.record_button.grid(row=0, column=0, padx=20, pady=20, sticky="w")
        
        # Status indicator
        self.status_frame = customtkinter.CTkFrame(self.control_frame, fg_color="transparent")
        self.status_frame.grid(row=0, column=1, padx=20, pady=20, sticky="e")
        
        self.status_dot = customtkinter.CTkLabel(
            self.status_frame,
            text="●",
            font=("Arial", 20),
            text_color="gray50"
        )
        self.status_dot.grid(row=0, column=0, padx=5)
        
        self.status_label = customtkinter.CTkLabel(
            self.status_frame,
            text="Ready",
            font=("Arial", 14),
            text_color="gray70"
        )
        self.status_label.grid(row=0, column=1, padx=5)

    def create_language_selection(self):
        """Creates an improved language selection interface."""
        self.language_frame = customtkinter.CTkFrame(self.content_frame)
        self.language_frame.grid(row=1, column=0, padx=20, pady=(0, 20), sticky="ew")
        self.language_frame.grid_columnconfigure(1, weight=1)
        
        # Language selection label
        self.language_title = customtkinter.CTkLabel(
            self.language_frame,
            text="🌐 Select Language:",
            font=("Arial", 14, "bold")
        )
        self.language_title.grid(row=0, column=0, padx=20, pady=15, sticky="w")
        
        # Language options
        self.language_options = [
            ("🇺🇸 English", "English"),
            ("🇪🇸 Spanish", "Spanish"), 
            ("🇫🇷 French", "French"),
            ("🇩🇪 German", "German"),
            ("🇯🇵 Japanese", "Japanese"),
            ("🇨🇳 Chinese", "Chinese"),
            ("🇷🇺 Russian", "Russian"),
            ("🇵🇹 Portuguese", "Portuguese"),
            ("🇮🇹 Italian", "Italian"),
            ("🇰🇷 Korean", "Korean"),
            ("🇸🇦 Arabic", "Arabic"),
            ("🇹🇷 Turkish", "Turkish"),
            ("🇺🇦 Ukrainian", "Ukrainian"),
            ("🇵🇱 Polish", "Polish"),
            ("🇳🇱 Dutch", "Dutch")
        ]
        
        self.language_var = customtkinter.StringVar(value="English")
        
        # Create scrollable frame for language buttons
        self.language_scroll_frame = customtkinter.CTkScrollableFrame(
            self.language_frame,
            orientation="horizontal",
            height=80
        )
        self.language_scroll_frame.grid(row=0, column=1, padx=20, pady=15, sticky="ew")
        
        self.language_buttons = []
        for i, (display_name, lang_code) in enumerate(self.language_options):
            button = customtkinter.CTkButton(
                self.language_scroll_frame,
                text=display_name,
                command=lambda l=lang_code: self.set_language(l),
                width=120,
                height=40,
                corner_radius=20,
                font=("Arial", 12)
            )
            button.grid(row=0, column=i, padx=5, pady=10, sticky="ew")
            self.language_buttons.append((button, lang_code))
        
        # Set initial language selection
        self.set_language("English")

    def create_transcription_area(self):
        """Creates the transcription display area."""
        self.transcription_frame = customtkinter.CTkFrame(self.content_frame)
        self.transcription_frame.grid(row=2, column=0, padx=20, pady=(0, 20), sticky="nsew")
        self.transcription_frame.grid_columnconfigure(0, weight=1)
        self.transcription_frame.grid_rowconfigure(1, weight=1)
        
        # Transcription header
        self.transcription_header = customtkinter.CTkFrame(self.transcription_frame, height=50)
        self.transcription_header.grid(row=0, column=0, sticky="ew", padx=0, pady=0)
        self.transcription_header.grid_columnconfigure(1, weight=1)
        
        self.transcription_title = customtkinter.CTkLabel(
            self.transcription_header,
            text="📝 Transcription",
            font=("Arial", 14, "bold")
        )
        self.transcription_title.grid(row=0, column=0, padx=20, pady=15, sticky="w")
        
        # Copy button
        self.copy_button = customtkinter.CTkButton(
            self.transcription_header,
            text="📋 Copy",
            command=self.copy_transcription,
            width=80,
            height=30,
            font=("Arial", 12)
        )
        self.copy_button.grid(row=0, column=1, padx=20, pady=15, sticky="e")
        
        # Transcription text area
        self.transcription_textbox = customtkinter.CTkTextbox(
            self.transcription_frame,
            state="disabled",
            font=("Arial", 14),
            corner_radius=10,
            border_width=2
        )
        self.transcription_textbox.grid(row=1, column=0, padx=15, pady=(0, 15), sticky="nsew")

    def create_footer(self):
        """Creates the footer with additional information."""
        self.footer_frame = customtkinter.CTkFrame(self.main_container, height=40, corner_radius=0)
        self.footer_frame.grid(row=2, column=0, sticky="ew", padx=0, pady=0)
        self.footer_frame.grid_columnconfigure(1, weight=1)
        
        self.footer_label = customtkinter.CTkLabel(
            self.footer_frame,
            text="Powered by Google Gemini AI",
            font=("Arial", 10),
            text_color="gray60"
        )
        self.footer_label.grid(row=0, column=0, padx=20, pady=10, sticky="w")
        
        self.version_label = customtkinter.CTkLabel(
            self.footer_frame,
            text="v1.0",
            font=("Arial", 10),
            text_color="gray60"
        )
        self.version_label.grid(row=0, column=1, padx=20, pady=10, sticky="e")

    def _initialize_client(self):
        """Initializes the Gemini client with an API key."""
        api_key = load_api_key()
        if not api_key:
            # Enhanced API key dialog
            dialog = customtkinter.CTkInputDialog(
                text="Please enter your Gemini API Key:",
                title="🔑 API Key Required"
            )
            api_key = dialog.get_input()
            if api_key:
                save_api_key(api_key)
                self.update_status("API key saved", "green")
            else:
                self.update_transcription_text(
                    "⚠️ Error: Gemini API Key not provided. Application will not function.\n\n"
                    "Please restart the application and provide a valid API key."
                )
                self.record_button.configure(state="disabled")
                self.update_status("No API key", "red")
                return

        if api_key:
            try:
                self.gemini_client = genai.Client(api_key=api_key)
                self.update_status("Connected", "green")
            except Exception as e:
                self.update_transcription_text(f"❌ Error initializing Gemini client: {e}")
                self.record_button.configure(state="disabled")
                self.update_status("Connection failed", "red")
        else:
            self.update_transcription_text(
                "⚠️ Error: Gemini API Key not available. Please restart and provide the key."
            )
            self.record_button.configure(state="disabled")
            self.update_status("No API key", "red")

    def update_status(self, message, color="gray"):
        """Updates the status indicator."""
        color_map = {
            "green": "#2fa572",
            "red": "#fa5252", 
            "orange": "#fd7e14",
            "blue": "#339af0",
            "gray": "gray50"
        }
        
        self.status_label.configure(text=message)
        self.status_dot.configure(text_color=color_map.get(color, "gray50"))

    def start_pulse_animation(self):
        """Starts a pulse animation for the record button."""
        if self.pulse_animation:
            return
            
        def pulse():
            if not self.recording:
                return
            
            # Animate button color
            current_color = self.record_button.cget("fg_color")
            if current_color == "#fa5252":  # Red
                self.record_button.configure(fg_color="#ff6b6b")
            else:
                self.record_button.configure(fg_color="#fa5252")
            
            # Schedule next pulse
            self.pulse_animation = self.after(500, pulse)
        
        pulse()

    def stop_pulse_animation(self):
        """Stops the pulse animation."""
        if self.pulse_animation:
            self.after_cancel(self.pulse_animation)
            self.pulse_animation = None

    def toggle_record(self):
        """Toggles the recording state."""
        if self.recording:
            self.stop_recording()
        else:
            self.start_recording()

    def set_language(self, language):
        """Sets the selected language and updates button appearance."""
        self.language_var.set(language)
        print(f"Selected language: {language}")
        
        # Update button appearances
        for button, lang_code in self.language_buttons:
            if lang_code == language:
                button.configure(fg_color=("#1f538d", "#14375e"))
            else:
                button.configure(fg_color=("gray75", "gray25"))

    def start_recording(self):
        """Starts the audio recording."""
        if not self.gemini_client:
            self.update_transcription_text("❌ Error: Gemini client not initialized. Check API Key.")
            return

        self.recording = True
        self.record_button.configure(
            text="⏹️ Stop Recording",
            fg_color="#fa5252",
            hover_color="#e03131"
        )
        self.update_status("Recording...", "red")
        self.start_pulse_animation()
        self.update_transcription_text("🎤 Recording in progress...\n\nSpeak clearly into your microphone.")

        self.audio_frames = []
        self.p_audio = pyaudio.PyAudio()

        self.stream = self.p_audio.open(format=pyaudio.paInt16,
                                         channels=1,
                                         rate=44100,
                                         input=True,
                                         frames_per_buffer=1024)
        
        self.record_thread = threading.Thread(target=self.record_audio, daemon=True)
        self.record_thread.start()

    def record_audio(self):
        """Records audio from the stream."""
        while self.recording:
            try:
                data = self.stream.read(1024)
                self.audio_frames.append(data)
            except (IOError, OSError):
                pass

    def stop_recording(self):
        """Stops the audio recording and starts transcription."""
        self.recording = False
        self.stop_pulse_animation()
        self.record_button.configure(
            text="🎤 Start Recording",
            fg_color=("#1f538d", "#14375e"),
            hover_color=("#1f538d", "#14375e")
        )
        self.update_status("Processing...", "orange")
        self.update_transcription_text("⏳ Recording stopped. Processing audio...\n\nPlease wait while we transcribe your audio.")

        if self.stream:
            self.stream.stop_stream()
            self.stream.close()
        if self.p_audio:
            self.p_audio.terminate()

        if self.record_thread and self.record_thread.is_alive():
            self.record_thread.join(timeout=1)
        self.record_thread = None

        try:
            with tempfile.NamedTemporaryFile(delete=False, suffix=".wav") as temp_audio_file:
                temp_file_path = temp_audio_file.name
                with wave.open(temp_audio_file, 'wb') as wave_file:
                    wave_file.setnchannels(1)
                    wave_file.setsampwidth(self.p_audio.get_sample_size(pyaudio.paInt16))
                    wave_file.setframerate(44100)
                    wave_file.writeframes(b''.join(self.audio_frames))
        except Exception as e:
            print(f"Error saving temporary audio file: {e}")
            self.update_transcription_text(f"❌ Error saving audio: {e}")
            self.update_status("Error", "red")
            return

        threading.Thread(target=self.transcribe_audio, args=(temp_file_path,), daemon=True).start()

    def transcribe_audio(self, file_path):
        """Transcribes the audio file using the Gemini API."""
        if not self.gemini_client:
            self.update_transcription_text("❌ Error: Gemini client not initialized.")
            self.update_status("Error", "red")
            return

        self.update_status("Uploading...", "blue")
        self.update_transcription_text("☁️ Uploading audio to Gemini AI...\n\nThis may take a few moments.")

        try:
            uploaded_file = self.gemini_client.files.upload(file=file_path)
            self.update_status("Transcribing...", "blue")
            self.update_transcription_text("🤖 AI is analyzing your audio...\n\nGenerating transcription...")

            language = self.language_var.get()
            prompt = (f"Generate a transcript of the speech in {language}, "
                      f"generate everything in one paragraph without timestamps.")

            response = self.gemini_client.models.generate_content(
                model="gemini-2.5-flash",
                contents=[prompt, uploaded_file],
            )

            self.gemini_client.files.delete(name=uploaded_file.name)

            if response.text:
                self.update_transcription_text(f"📝 Transcription Complete:\n\n{response.text}")
                self.update_status("Complete", "green")
            else:
                self.update_transcription_text("❌ Transcription failed: No text in response.")
                self.update_status("Failed", "red")

        except Exception as e:
            error_message = f"❌ An error occurred during transcription:\n\n{type(e).__name__}: {e}"
            self.update_transcription_text(error_message)
            self.update_status("Error", "red")
            if os.path.exists(file_path):
                os.remove(file_path)

    def copy_transcription(self):
        """Copies the transcription text to clipboard."""
        text = self.transcription_textbox.get("1.0", tk.END).strip()
        if text and not text.startswith(("🎤", "⏳", "☁️", "🤖", "❌", "⚠️")):
            # Remove the "📝 Transcription Complete:" prefix if present
            if text.startswith("📝 Transcription Complete:"):
                text = text.replace("📝 Transcription Complete:\n\n", "")
            
            self.clipboard_clear()
            self.clipboard_append(text)
            self.update_status("Copied to clipboard", "green")
            
            # Reset status after 2 seconds
            self.after(2000, lambda: self.update_status("Ready", "gray"))

    def update_transcription_text(self, text):
        """Thread-safe update of the transcription textbox."""
        if threading.current_thread() is not threading.main_thread():
            self.after(0, lambda t=text: self.update_transcription_text(t))
            return
        
        self.transcription_textbox.configure(state="normal")
        self.transcription_textbox.delete("1.0", tk.END)
        self.transcription_textbox.insert("1.0", text)
        self.transcription_textbox.configure(state="disabled")


if __name__ == "__main__":
    app = App()
    app.mainloop()
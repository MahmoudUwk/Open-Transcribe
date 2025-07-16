"""
A simple application for recording audio and transcribing it using Google's Gemini API.
"""
import json
import os
import tempfile
import threading
import time
import tkinter as tk
from tkinter import messagebox, ttk
import wave

import customtkinter
import pyaudio
from google import genai
from retrying import retry


customtkinter.set_appearance_mode("dark")
customtkinter.set_default_color_theme("blue")

PROMPTS = {
    "Transcribe": "Generate a transcript of the speech in {languages}. Generate everything in one paragraph without timestamps.",
    "Transcribe and Plan": "Transcribe the following audio. Then, based on the transcription, create a concise action plan or a summary of the key points. Format the output clearly with a 'Transcription' section and a 'Plan' section."
}


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


class ConfigManager:
    def __init__(self, config_dir):
        self.config_dir = config_dir
        self.config_path = os.path.join(self.config_dir, 'settings.json')
        self.settings = self.load_settings()

    def load_settings(self):
        if not os.path.exists(self.config_path):
            return {}
        try:
            with open(self.config_path, 'r', encoding='utf-8') as f:
                return json.load(f)
        except (json.JSONDecodeError, IOError) as e:
            print(f"Error loading settings: {e}")
            return {}

    def save_settings(self):
        os.makedirs(self.config_dir, exist_ok=True)
        try:
            with open(self.config_path, 'w', encoding='utf-8') as f:
                json.dump(self.settings, f, indent=4)
        except IOError as e:
            print(f"Error saving settings: {e}")

    def get_setting(self, key, default=None):
        return self.settings.get(key, default)

    def set_setting(self, key, value):
        self.settings[key] = value
        self.save_settings()

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

        self.config_manager = ConfigManager(get_app_config_dir())
        self.prompts = PROMPTS

        # Load saved settings
        saved_languages = self.config_manager.get_setting('selected_languages', ['English'])
        self.selected_languages = saved_languages if isinstance(saved_languages, list) else [saved_languages]
        self.selected_prompt = self.config_manager.get_setting('selected_prompt', list(self.prompts.keys())[0])

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
        """Creates the main content area with a two-column layout."""
        self.main_content_frame = customtkinter.CTkFrame(self.main_container, corner_radius=0, fg_color="transparent")
        self.main_content_frame.grid(row=1, column=0, sticky="nsew", padx=20, pady=20)
        self.main_content_frame.grid_columnconfigure(0, weight=1)  # Left column
        self.main_content_frame.grid_columnconfigure(1, weight=4)  # Right column (4x wider)
        self.main_content_frame.grid_rowconfigure(0, weight=1)

        # --- Left Column ---
        self.left_frame = customtkinter.CTkFrame(self.main_content_frame, fg_color="transparent")
        self.left_frame.grid(row=0, column=0, sticky="nsew", padx=(0, 10))
        self.left_frame.grid_columnconfigure(0, weight=1)
        self.left_frame.grid_rowconfigure(1, weight=1) # Allow language list to expand

        # Control panel and Language selection
        self.create_control_panel(self.left_frame)
        self.create_language_selection(self.left_frame)

        # --- Right Column ---
        self.right_frame = customtkinter.CTkFrame(self.main_content_frame, fg_color="transparent")
        self.right_frame.grid(row=0, column=1, sticky="nsew", padx=(10, 0))
        self.right_frame.grid_columnconfigure(0, weight=1)
        self.right_frame.grid_rowconfigure(0, weight=1)  # Prompt area
        self.right_frame.grid_rowconfigure(1, weight=4)  # Transcription area (4x taller)

        # Prompt selection and Transcription area
        self.create_prompt_selection(self.right_frame)
        self.create_transcription_area(self.right_frame)

    def create_prompt_selection(self, parent_frame):
        """Creates the prompt selection dropdown."""
        self.prompt_frame = customtkinter.CTkFrame(parent_frame)
        self.prompt_frame.grid(row=0, column=0, sticky="ew", pady=(0, 10))
        self.prompt_frame.grid_columnconfigure(1, weight=1)

        self.prompt_label = customtkinter.CTkLabel(self.prompt_frame, text="Prompt:", font=("Arial", 16, "bold"))
        self.prompt_label.grid(row=0, column=0, padx=(10, 5), pady=10, sticky="w")

        self.prompt_menu = customtkinter.CTkOptionMenu(
            self.prompt_frame,
            values=list(self.prompts.keys()),
            command=self.set_prompt,
            variable=customtkinter.StringVar(value=self.selected_prompt),
            font=("Arial", 14),
            dropdown_font=("Arial", 12)
        )
        self.prompt_menu.grid(row=0, column=1, padx=(0, 10), pady=10, sticky="ew")

    def set_prompt(self, prompt_name):
        """Sets the selected prompt and saves it to config."""
        self.selected_prompt = prompt_name
        self.config_manager.set_setting('selected_prompt', self.selected_prompt)
        self.update_status(f"Prompt set to: {prompt_name}", "blue")
        self.after(2000, lambda: self.update_status("Ready"))

    def create_control_panel(self, parent_frame):
        """Creates the control panel with record button and status."""
        self.control_frame = customtkinter.CTkFrame(parent_frame, height=100)
        self.control_frame.grid(row=0, column=0, sticky="ew", pady=(0, 10))
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

    def create_language_selection(self, parent_frame):
        """Creates an improved language selection interface."""
        self.language_frame = customtkinter.CTkFrame(parent_frame)
        self.language_frame.grid(row=1, column=0, sticky="nsew", pady=(10,0))
        self.language_frame.grid_columnconfigure(1, weight=1)
        
        # Language selection label
        self.language_title = customtkinter.CTkLabel(
            self.language_frame,
            text="🌐 Select Languages:",
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
        
        # Create scrollable frame for language buttons
        self.language_scroll_frame = customtkinter.CTkScrollableFrame(
            self.language_frame,
            orientation="vertical",
            label_text="Languages"
        )
        self.language_scroll_frame.grid(row=1, column=0, columnspan=2, padx=10, pady=(0,10), sticky="nsew")
        self.language_frame.grid_rowconfigure(1, weight=1)
        
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
            button.pack(fill="x", padx=10, pady=5)
            self.language_buttons.append((button, lang_code))
        
        self.update_language_button_styles()

    def create_transcription_area(self, parent_frame):
        """Creates the transcription display area."""
        self.transcription_frame = customtkinter.CTkFrame(parent_frame)
        self.transcription_frame.grid(row=1, column=0, sticky="nsew")
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

        # Status indicator for transcription result
        self.transcription_status_label = customtkinter.CTkLabel(
            self.transcription_header,
            text="●",
            font=("Arial", 18, "bold"),
            text_color="gray50"
        )
        self.transcription_status_label.grid(row=0, column=1, padx=10, pady=15, sticky="w")
        
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
        if language in self.selected_languages:
            if len(self.selected_languages) > 1: # Prevent removing the last language
                self.selected_languages.remove(language)
        else:
            self.selected_languages.append(language)
        
        self.config_manager.set_setting('selected_languages', self.selected_languages)
        self.update_language_button_styles()

    def update_language_button_styles(self):
        """Updates the appearance of language buttons based on current selections."""
        for button, lang_code in self.language_buttons:
            if lang_code in self.selected_languages:
                button.configure(fg_color=("#1f538d", "#14375e"))
            else:
                button.configure(fg_color=("gray75", "gray25"))

    def start_recording(self):
        """Starts the audio recording."""
        if not self.gemini_client:
            self.update_transcription_text("❌ Error: Gemini client not initialized. Check API Key.")
            return

        try:
            self.p_audio = pyaudio.PyAudio()
            self.stream = self.p_audio.open(
                format=pyaudio.paInt16,
                channels=1,
                rate=44100,
                input=True,
                frames_per_buffer=1024
            )
        except Exception as e:
            messagebox.showerror("Audio Error", f"Could not start recording. Please check your microphone. Error: {e}")
            self.update_status("Audio device error", "red")
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
                with wave.open(temp_file_path, 'wb') as wave_file:
                    wave_file.setnchannels(1)
                    wave_file.setsampwidth(self.p_audio.get_sample_size(pyaudio.paInt16))
                    wave_file.setframerate(44100)
                    wave_file.writeframes(b''.join(self.audio_frames))
        except Exception as e:
            messagebox.showerror("File Error", f"Could not save the recorded audio file. Error: {e}")
            self.update_status("File save error", "red")
            return

        threading.Thread(target=self.transcribe_audio, args=(temp_file_path,), daemon=True).start()

    def transcribe_audio(self, file_path):
        """Transcribes the audio file using the Gemini API with retry logic and displays errors instead of exiting."""
        if not self.gemini_client:
            self.update_transcription_text("❌ Error: Gemini client not initialized. Check API Key.")
            self.update_status("Error", "red")
            return

        self.update_status("Uploading...", "blue")
        self.update_transcription_text("☁️ Uploading audio to Gemini AI...\n\nThis may take a few moments.")

        try:
            self.update_status("Transcribing...", "blue")
            self.update_transcription_text("🤖 AI is analyzing your audio...\n\nGenerating transcription...")
            
            response_text = self._perform_transcription(file_path)

            if response_text:
                self.update_transcription_text(response_text)
                self.update_transcription_status("green")
                self.update_status("Complete", "green")
            else:
                self.update_transcription_text("❌ Transcription failed: No text in response.")
                self.update_transcription_status("red")
                self.update_status("Failed", "red")

        except Exception as err:
            error_message = f"❌ An error occurred during transcription: {err}"
            self.update_transcription_text(error_message)
            self.update_transcription_status("red")
            self.update_status("Error", "red")
            messagebox.showerror(
                "Transcription Failed",
                f"Sorry, the audio could not be transcribed after several attempts.\n\n"
                f"Error: {err}\n\n"
                f"The recorded audio has been saved at:\n{file_path}"
            )

    @retry(stop_max_attempt_number=3, wait_fixed=2000)
    def _perform_transcription(self, file_path):
        """Performs the actual transcription with the Gemini API and includes retry logic."""
        uploaded_file = self.gemini_client.files.upload(file=file_path)

        try:
            languages = ", ".join(self.selected_languages) if self.selected_languages else "the detected language"
            prompt_template = self.prompts.get(self.selected_prompt, list(self.prompts.values())[0])
            prompt = prompt_template.format(languages=languages)

            response = self.gemini_client.models.generate_content(
                model="gemini-1.5-flash",
                contents=[prompt, uploaded_file],
            )
            return response.text
        finally:
            self.gemini_client.files.delete(name=uploaded_file.name)

    def update_transcription_status(self, color: str):
        """Update transcription status indicator dot color."""
        color_map = {
            "green": "#2fa572",
            "red": "#fa5252",
            "orange": "#fd7e14",
            "blue": "#339af0",
            "gray": "gray50",
        }
        self.transcription_status_label.configure(text_color=color_map.get(color, "gray50"))

    def copy_transcription(self):
        """Copies the transcription text (excluding status icons) to clipboard."""
        text = self.transcription_textbox.get("1.0", tk.END).strip()
        if not text or text.startswith(("🎤", "⏳", "☁️", "🤖", "❌", "⚠️")):
            return
        self.clipboard_clear()
        self.clipboard_append(text)
        self.update_status("Copied to clipboard", "green")
        self.after(2000, lambda: self.update_status("Ready"))

    def update_transcription_text(self, text):
        """Thread-safe update of the transcription textbox."""
        if threading.current_thread() is not threading.main_thread():
            self.after(0, lambda t=text: self.update_transcription_text(t))
        
        self.transcription_textbox.configure(state="normal")
        self.transcription_textbox.delete("1.0", tk.END)
        self.transcription_textbox.insert("1.0", text)
        self.transcription_textbox.configure(state="disabled")


if __name__ == "__main__":
    app = App()
    app.mainloop()
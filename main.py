import customtkinter
import tkinter as tk
import pyaudio
import wave
import threading
import io
import os
import json
# import logging # Removed logging import
from google import genai
from dotenv import load_dotenv # Keep for now, will remove after confirming API key logic

# Configure logging (removed)
# logging.basicConfig(
#     level=logging.DEBUG,
#     format='%(asctime)s - %(levelname)s - %(message)s',
#     filename='app.log',
#     filemode='w'
# )

customtkinter.set_appearance_mode("dark")
customtkinter.set_default_color_theme("blue")

def get_app_config_dir():
    if os.name == 'nt':  # Windows
        return os.path.join(os.environ['APPDATA'], 'EasyTranscribe')
    else:  # Linux/macOS
        return os.path.join(os.path.expanduser('~'), '.config', 'EasyTranscribe')

def load_api_key():
    config_dir = get_app_config_dir()
    config_path = os.path.join(config_dir, 'config.json')
    # logging.debug(f"Attempting to load API key from: {config_path}") # Removed logging
    if os.path.exists(config_path):
        try:
            with open(config_path, 'r') as f:
                config = json.load(f)
                api_key = config.get('GEMINI_API_KEY')
                if api_key:
                    # logging.debug("API key loaded successfully.") # Removed logging
                    pass
                else:
                    # logging.warning("API key not found in config file.") # Removed logging
                    print("API key not found in config file.") # Added print for user feedback
                return api_key
        except json.JSONDecodeError as e:
            # logging.error(f"Error decoding config.json: {e}") # Removed logging
            print(f"Error decoding config.json: {e}") # Added print for user feedback
            return None
    # logging.debug("Config file not found.") # Removed logging
    print("Config file not found.") # Added print for user feedback
    return None

def save_api_key(api_key):
    config_dir = get_app_config_dir()
    os.makedirs(config_dir, exist_ok=True)
    config_path = os.path.join(config_dir, 'config.json')
    # logging.debug(f"Attempting to save API key to: {config_path}") # Removed logging
    if api_key:
        try:
            with open(config_path, 'w') as f:
                json.dump({'GEMINI_API_KEY': api_key}, f)
            # logging.debug("API key saved successfully.") # Removed logging
            print("API key saved successfully.") # Added print for user feedback
        except IOError as e:
            # logging.error(f"Error saving API key to config.json: {e}") # Removed logging
            print(f"Error saving API key to config.json: {e}") # Added print for user feedback
    else:
        print("API key not provided, not saving.")

class App(customtkinter.CTk):
    def __init__(self):
        super().__init__()

        self.title("Easy Transcribe")
        self.geometry("800x600")

        self.grid_columnconfigure(0, weight=1)
        self.grid_rowconfigure(0, weight=1)

        # Main content frame
        self.main_frame = customtkinter.CTkFrame(self)
        self.main_frame.grid(row=0, column=0, padx=20, pady=20, sticky="nsew")
        self.main_frame.grid_columnconfigure(2, weight=1)
        self.main_frame.grid_rowconfigure(1, weight=1)

        self.record_button = customtkinter.CTkButton(self.main_frame, text="Record", command=self.toggle_record, font=("Arial", 16), height=50)
        self.record_button.grid(row=0, column=0, padx=20, pady=10, sticky="w")
        
        # Language selection
        self.language_label = customtkinter.CTkLabel(self.main_frame, text="Language:")
        self.language_label.grid(row=0, column=1, padx=(20, 5), pady=10, sticky="w")

        self.language_options = ["English", "Spanish", "French", "German", "Japanese", "Arabic"]
        self.language_var = customtkinter.StringVar(value=self.language_options[0])
        self.language_menu = customtkinter.CTkOptionMenu(self.main_frame, values=self.language_options, variable=self.language_var)
        self.language_menu.grid(row=0, column=2, padx=(0, 20), pady=10, sticky="w")


        self.transcription_textbox = customtkinter.CTkTextbox(self.main_frame, state="disabled", font=("Arial", 16))
        self.transcription_textbox.grid(row=1, column=0, columnspan=3, padx=20, pady=20, sticky="nsew")

        self.recording = False
        self.audio_frames = []
        self.p_audio = None
        self.stream = None
        self.gemini_client = None

        api_key = load_api_key()
        if not api_key:
            # logging.info("API key not found, prompting user.") # Removed logging
            print("API key not found, prompting user.") # Added print for user feedback
            dialog = customtkinter.CTkInputDialog(text="Please enter your Gemini API Key:", title="API Key Required")
            api_key = dialog.get_input()
            if api_key:
                save_api_key(api_key)
            else:
                self.update_transcription_text("Error: Gemini API Key not provided. Application will not function.")
                self.record_button.configure(state="disabled")
                # logging.error("User did not provide API key.") # Removed logging
                print("User did not provide API key.") # Added print for user feedback
                return

        if api_key:
            try:
                self.gemini_client = genai.Client(api_key=api_key)
                # logging.info("Gemini client initialized successfully.") # Removed logging
                print("Gemini client initialized successfully.") # Added print for user feedback
            except Exception as e:
                self.update_transcription_text(f"Error initializing Gemini client: {e}")
                self.record_button.configure(state="disabled")
                # logging.exception("Error initializing Gemini client.") # Removed logging
                print(f"Error initializing Gemini client: {e}") # Added print for user feedback
        else:
            self.update_transcription_text("Error: Gemini API Key not available. Please restart and provide the key.")
            self.record_button.configure(state="disabled")
            # logging.error("API key is None after load/prompt.") # Removed logging
            print("API key is None after load/prompt.") # Added print for user feedback

    def toggle_record(self):
        if self.recording:
            self.stop_recording()
        else:
            self.start_recording()

    def start_recording(self):
        # logging.debug("Starting recording.") # Removed logging
        print("Starting recording.") # Added print for user feedback
        if not self.gemini_client:
            self.update_transcription_text("Error: Gemini client not initialized. Check API Key.")
            # logging.error("Attempted to start recording with uninitialized Gemini client.") # Removed logging
            print("Attempted to start recording with uninitialized Gemini client.") # Added print for user feedback
            return
        
        self.recording = True
        self.record_button.configure(text="Stop")
        self.update_transcription_text("Recording...")

        self.audio_frames = []
        self.p_audio = pyaudio.PyAudio()

        self.stream = self.p_audio.open(format=pyaudio.paInt16,
                                         channels=1,
                                         rate=44100,
                                         input=True,
                                         frames_per_buffer=1024)
        # logging.debug("Audio stream opened.") # Removed logging
        print("Audio stream opened.") # Added print for user feedback
        threading.Thread(target=self.record_audio, daemon=True).start()

    def record_audio(self):
        # logging.debug("Recording audio in background thread.") # Removed logging
        print("Recording audio in background thread.") # Added print for user feedback
        while self.recording:
            try:
                data = self.stream.read(1024)
                self.audio_frames.append(data)
            except IOError as e:
                # logging.error(f"IOError during audio recording: {e}") # Removed logging
                print(f"IOError during audio recording: {e}") # Added print for user feedback
                # This can happen if the stream is closed while reading
                pass

    def stop_recording(self):
        # logging.debug("Stopping recording.") # Removed logging
        print("Stopping recording.") # Added print for user feedback
        self.recording = False
        self.record_button.configure(text="Record")
        self.update_transcription_text("Recording stopped. Processing...")

        if self.stream:
            self.stream.stop_stream()
            self.stream.close()
            # logging.debug("Audio stream stopped and closed.") # Removed logging
            print("Audio stream stopped and closed.") # Added print for user feedback
        if self.p_audio:
            self.p_audio.terminate()
            # logging.debug("PyAudio terminated.") # Removed logging
            print("PyAudio terminated.") # Added print for user feedback

        temp_file_path = "temp_recorded_audio.wav"
        try:
            with wave.open(temp_file_path, 'wb') as wf:
                wf.setnchannels(1)
                wf.setsampwidth(self.p_audio.get_sample_size(pyaudio.paInt16))
                wf.setframerate(44100)
                wf.writeframes(b''.join(self.audio_frames))
            # logging.debug(f"Temporary audio file saved: {temp_file_path}") # Removed logging
            print(f"Temporary audio file saved: {temp_file_path}") # Added print for user feedback
        except Exception as e:
            # logging.exception(f"Error saving temporary audio file: {e}") # Removed logging
            print(f"Error saving temporary audio file: {e}") # Added print for user feedback
            self.update_transcription_text(f"Error saving audio: {e}")
            return
        
        threading.Thread(target=self.transcribe_audio, args=(temp_file_path,), daemon=True).start()


    def transcribe_audio(self, file_path):
        # logging.debug(f"Transcribing audio from: {file_path}") # Removed logging
        print(f"Transcribing audio from: {file_path}") # Added print for user feedback
        if not self.gemini_client:
            self.update_transcription_text("Error: Gemini client not initialized.")
            # logging.error("Gemini client not initialized during transcription.") # Removed logging
            print("Gemini client not initialized during transcription.") # Added print for user feedback
            return
        
        self.update_transcription_text("Uploading audio...")

        try:
            uploaded_file = self.gemini_client.files.upload(file=file_path)
            # logging.debug(f"Audio file uploaded. File name: {uploaded_file.name}") # Removed logging
            print(f"Audio file uploaded. File name: {uploaded_file.name}") # Added print for user feedback
            self.update_transcription_text("Transcribing...")
            
            language = self.language_var.get()
            prompt = f"Generate a transcript of the speech in {language}, generate everything in one paragraph without timestamps."
            # logging.debug(f"Prompt sent to Gemini: {prompt}") # Removed logging
            print(f"Prompt sent to Gemini: {prompt}") # Added print for user feedback

            response = self.gemini_client.models.generate_content(
                model="gemini-2.5-flash",
                contents=[prompt, uploaded_file],
            )
            
            # logging.debug(f"Raw Gemini response text: {response.text}") # Removed logging
            print(f"Raw Gemini response text: {response.text}") # Added print for user feedback

            self.gemini_client.files.delete(name=uploaded_file.name)
            # logging.debug(f"Uploaded file {uploaded_file.name} deleted.") # Removed logging
            print(f"Uploaded file {uploaded_file.name} deleted.") # Added print for user feedback
            os.remove(file_path)
            # logging.debug(f"Local temporary file {file_path} removed.") # Removed logging
            print(f"Local temporary file {file_path} removed.") # Added print for user feedback
            
            if response.text:
                 self.update_transcription_text(response.text)
            else:
                self.update_transcription_text("Transcription failed: No text in response.")

        except Exception as e:
            error_message = f"An error occurred during transcription:\n\n{type(e).__name__}: {e}"
            self.update_transcription_text(error_message)
            # logging.exception("Exception occurred during transcription:") # Removed logging
            print(f"Exception occurred during transcription: {e}") # Added print for user feedback
            if os.path.exists(file_path):
                os.remove(file_path)
                # logging.debug(f"Local temporary file {file_path} removed after error.") # Removed logging
                print(f"Local temporary file {file_path} removed after error.") # Added print for user feedback


    def update_transcription_text(self, text):
        self.transcription_textbox.configure(state="normal")
        self.transcription_textbox.delete("1.0", tk.END)
        self.transcription_textbox.insert("1.0", text)
        self.transcription_textbox.configure(state="disabled")


if __name__ == "__main__":
    app = App()
    app.mainloop()
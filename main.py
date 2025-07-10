import customtkinter
import tkinter as tk
import pyaudio
import wave
import threading
import io
import os
from google import genai
from pydantic import BaseModel
from dotenv import load_dotenv

customtkinter.set_appearance_mode("dark")
customtkinter.set_default_color_theme("blue")

class Recipe(BaseModel):
    recipe_name: str
    ingredients: list[str]

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

        self.record_button = customtkinter.CTkButton(self.main_frame, text="Record", command=self.toggle_record)
        self.record_button.grid(row=0, column=0, padx=20, pady=10, sticky="w")
        
        # Language selection
        self.language_label = customtkinter.CTkLabel(self.main_frame, text="Language:")
        self.language_label.grid(row=0, column=1, padx=(20, 5), pady=10, sticky="w")

        self.language_options = ["English", "Spanish", "French", "German", "Japanese", "Arabic"]
        self.language_var = customtkinter.StringVar(value=self.language_options[0])
        self.language_menu = customtkinter.CTkOptionMenu(self.main_frame, values=self.language_options, variable=self.language_var)
        self.language_menu.grid(row=0, column=2, padx=(0, 20), pady=10, sticky="w")


        self.transcription_textbox = customtkinter.CTkTextbox(self.main_frame, state="disabled")
        self.transcription_textbox.grid(row=1, column=0, columnspan=3, padx=20, pady=20, sticky="nsew")

        self.recording = False
        self.audio_frames = []
        self.p_audio = None
        self.stream = None
        self.gemini_client = None

        load_dotenv()
        api_key = os.getenv("GEMINI_API_KEY")
        if not api_key:
            self.update_transcription_text("Error: GEMINI_API_KEY not found in .env file.\nPlease set it and restart the application.")
            self.record_button.configure(state="disabled")
        else:
            try:
                self.gemini_client = genai.Client(api_key=api_key)
            except Exception as e:
                self.update_transcription_text(f"Error initializing Gemini client: {e}")
                self.record_button.configure(state="disabled")

    def toggle_record(self):
        if self.recording:
            self.stop_recording()
        else:
            self.start_recording()

    def start_recording(self):
        if not self.gemini_client:
            self.update_transcription_text("Error: Gemini client not initialized. Check API Key in .env file.")
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

        threading.Thread(target=self.record_audio, daemon=True).start()

    def record_audio(self):
        while self.recording:
            try:
                data = self.stream.read(1024)
                self.audio_frames.append(data)
            except IOError:
                # This can happen if the stream is closed while reading
                pass

    def stop_recording(self):
        self.recording = False
        self.record_button.configure(text="Record")
        self.update_transcription_text("Recording stopped. Processing...")

        if self.stream:
            self.stream.stop_stream()
            self.stream.close()
        if self.p_audio:
            self.p_audio.terminate()

        temp_file_path = "temp_recorded_audio.wav"
        with wave.open(temp_file_path, 'wb') as wf:
            wf.setnchannels(1)
            wf.setsampwidth(self.p_audio.get_sample_size(pyaudio.paInt16))
            wf.setframerate(44100)
            wf.writeframes(b''.join(self.audio_frames))
        
        threading.Thread(target=self.transcribe_audio, args=(temp_file_path,), daemon=True).start()


    def transcribe_audio(self, file_path):
        if not self.gemini_client:
            self.update_transcription_text("Error: Gemini client not initialized.")
            return
        
        self.update_transcription_text("Uploading audio...")

        try:
            uploaded_file = self.gemini_client.files.upload(file=file_path)
            self.update_transcription_text("Transcribing...")
            
            prompt = "Generate a transcript of the speech."

            response = self.gemini_client.models.generate_content(
                model="gemini-2.5-flash",
                contents=[prompt, uploaded_file],
            )
            
            self.gemini_client.files.delete(name=uploaded_file.name)
            os.remove(file_path)
            
            if response.text:
                 self.update_transcription_text(response.text)
            else:
                self.update_transcription_text("Transcription failed: No text in response.")

        except Exception as e:
            error_message = f"An error occurred during transcription:\n\n{type(e).__name__}: {e}"
            self.update_transcription_text(error_message)
            if os.path.exists(file_path):
                os.remove(file_path)


    def update_transcription_text(self, text):
        self.transcription_textbox.configure(state="normal")
        self.transcription_textbox.delete("1.0", tk.END)
        self.transcription_textbox.insert("1.0", text)
        self.transcription_textbox.configure(state="disabled")


if __name__ == "__main__":
    app = App()
    app.mainloop()

!pip install -q flask
!pip install -q flask-cors
!pip install -q pyngrok
!pip install -q omnivoice
!pip install -q openai-whisper
!pip install -q soundfile


# =====================================================
# IMPORTS
# =====================================================

from flask import Flask, request, jsonify, send_file
from flask_cors import CORS

import tempfile
import threading
import torch
import whisper
import soundfile as sf
import os

from omnivoice import OmniVoice
from pyngrok import ngrok


# =====================================================
# NGROK AUTH TOKEN
# =====================================================

ngrok.set_auth_token(
    "3ELr4pfCXg2RFd0d95reCOoGIt4_6NGcBpy8uzjC5Y4dthorQ"
)


# =====================================================
# FLASK APP
# =====================================================

app = Flask(__name__)
CORS(app)


# =====================================================
# DEVICE
# =====================================================

device = "cuda" if torch.cuda.is_available() else "cpu"

print("\n===================================")
print("Using device:", device)
print("===================================\n")


# =====================================================
# LOAD OMNIVOICE MODEL
# =====================================================

print("Loading OmniVoice model...\n")

model = OmniVoice.from_pretrained(
    "k2-fsa/OmniVoice",
    dtype=torch.float16 if device == "cuda" else torch.float32
)

# IMPORTANT FIX
model = model.to(device)

print("✅ OmniVoice model loaded successfully!\n")


# =====================================================
# LOAD WHISPER MODEL
# =====================================================

print("Loading Whisper model...\n")

asr_model = whisper.load_model("base")

# IMPORTANT FIX
asr_model = asr_model.to(device)

print("✅ Whisper model loaded successfully!\n")


# =====================================================
# HOME ROUTE
# =====================================================

@app.route("/")
def home():

    return jsonify({
        "message": "OmniVoice backend running successfully"
    })


# =====================================================
# GENERATE ROUTE
# =====================================================

@app.route("/generate", methods=["POST"])
def generate_audio():

    try:

        # =================================================
        # GET TARGET TEXT
        # =================================================

        target_text = request.form.get("text")

        if (
            target_text is None
            or target_text.strip() == ""
        ):

            return jsonify({
                "error": "Target text missing"
            }), 400

        print("\n===================================")
        print("TARGET TEXT:")
        print(target_text)
        print("===================================\n")

        # =================================================
        # OPTIONAL AUDIO
        # =================================================

        reference_audio = request.files.get("audio")

        # =================================================
        # NORMAL TTS
        # =================================================

        if reference_audio is None:

            print("Running NORMAL TTS...\n")

            with torch.no_grad():

                audio = model.generate(
                    text=target_text
                )

        # =================================================
        # VOICE CLONING
        # =================================================

        else:

            print("Reference audio received.\n")

            # =============================================
            # SAVE TEMP AUDIO
            # =============================================

            temp_audio = tempfile.NamedTemporaryFile(
                suffix=".wav",
                delete=False
            )

            reference_audio.save(temp_audio.name)

            print("Temporary audio path:")
            print(temp_audio.name)

            # =============================================
            # TRANSCRIBE AUDIO
            # =============================================

            print("\nTranscribing reference audio...\n")

            transcript = asr_model.transcribe(
                temp_audio.name
            )["text"]

            print("Detected Transcript:")
            print(transcript)

            # =============================================
            # GENERATE CLONED VOICE
            # =============================================

            print("\nGenerating cloned voice...\n")

            with torch.no_grad():

                audio = model.generate(
                    text=target_text,
                    ref_audio=temp_audio.name,
                    ref_text=transcript
                )

            # =============================================
            # DELETE TEMP AUDIO
            # =============================================

            try:
                os.remove(temp_audio.name)
            except:
                pass

        # =================================================
        # SAVE GENERATED AUDIO
        # =================================================

        output_path = tempfile.NamedTemporaryFile(
            suffix=".wav",
            delete=False
        ).name

        sf.write(
            output_path,
            audio[0],
            24000
        )

        print("\nGenerated audio saved:")
        print(output_path)

        # =================================================
        # RETURN AUDIO
        # =================================================

        return send_file(
            output_path,
            mimetype="audio/wav",
            as_attachment=True,
            download_name="generated.wav"
        )

    except Exception as e:

        print("\n===================================")
        print("ERROR:")
        print(str(e))
        print("===================================\n")

        return jsonify({
            "error": str(e)
        }), 500


# =====================================================
# RUN FLASK
# =====================================================

def run_flask():

    app.run(
        host="0.0.0.0",
        port=5001,
        debug=False,
        use_reloader=False
    )


# =====================================================
# START SERVER
# =====================================================

thread = threading.Thread(
    target=run_flask
)

thread.daemon = True
thread.start()


# =====================================================
# CREATE NGROK TUNNEL
# =====================================================

public_url = ngrok.connect(5001)

print("\n===================================")
print("🚀 PUBLIC BACKEND URL:")
print(public_url)
print("===================================\n")


# =====================================================
# KEEP NOTEBOOK ALIVE
# =====================================================

print("✅ Backend is running successfully!")


import { useState, useRef } from "react";
import axios from "axios";
import "./App.css";

const DEFAULT_BACKEND_URL =
  "https://tutu-spookily-squishier.ngrok-free.dev/generate";

function App() {

  const [text, setText] = useState("");
  const [audioFile, setAudioFile] = useState(null);
  const [audioPreviewUrl, setAudioPreviewUrl] = useState(null);
  const [generatedAudio, setGeneratedAudio] = useState(null);
  const [loading, setLoading] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const mediaRecorderRef = useRef(null);
  const chunksRef = useRef([]);

  // ===================================================
  // START RECORDING
  // ===================================================

  const startRecording = async () => {
    try {
      const stream =
        await navigator.mediaDevices.getUserMedia({
          audio: true
        });

      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];
      setIsRecording(true);
      setErrorMessage("");
      setSuccessMessage("");

      mediaRecorder.ondataavailable = (event) => {
        chunksRef.current.push(event.data);
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, {
          type: "audio/wav"
        });

        const file = new File([blob], "recorded.wav", {
          type: "audio/wav"
        });

        const previewUrl = URL.createObjectURL(blob);
        setAudioFile(file);
        setAudioPreviewUrl(previewUrl);
        setIsRecording(false);
        setSuccessMessage("Voice sample recorded successfully.");
      };

      mediaRecorder.start();
    } catch (error) {
      console.error(error);
      setIsRecording(false);
      setErrorMessage("Microphone access denied or unsupported browser.");
    }
  };

  // ===================================================
  // STOP RECORDING
  // ===================================================

  const stopRecording = () => {
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stop();
    }
  };

  // ===================================================
  // SET AUDIO FILE
  // ===================================================

  const handleFileUpload = (file) => {
    if (!file) {
      setAudioFile(null);
      setAudioPreviewUrl(null);
      return;
    }

    const previewUrl = URL.createObjectURL(file);
    setAudioFile(file);
    setAudioPreviewUrl(previewUrl);
    setSuccessMessage("Voice sample uploaded successfully.");
    setErrorMessage("");
  };

  // ===================================================
  // CLEAR AUDIO
  // ===================================================

  const clearAudio = () => {
    setAudioFile(null);
    setAudioPreviewUrl(null);
    setSuccessMessage("Voice sample cleared.");
  };

  // ===================================================
  // GENERATE AUDIO
  // ===================================================

  const generateAudio = async () => {
    if (!text.trim()) {
      setErrorMessage("Please add text before generating.");
      return;
    }

    try {
      setLoading(true);
      setErrorMessage("");
      setSuccessMessage("Generating your cloned voice...");

      const formData = new FormData();
      formData.append("text", text);
      if (audioFile) {
        formData.append("audio", audioFile);
      }

      const response = await axios.post(DEFAULT_BACKEND_URL.trim(), formData, {
        responseType: "blob"
      });

      const audioUrl = URL.createObjectURL(response.data);
      setGeneratedAudio(audioUrl);
      setSuccessMessage("Voice cloning complete! Your audio is ready.");
    } catch (error) {
      console.error(error);
      const message =
        error.response?.data?.error ||
        error.response?.statusText ||
        error.message ||
        "Generation failed";
      setErrorMessage(message);
      setGeneratedAudio(null);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="app-root">
      <div className="app-content">
        <header className="hero">
          <h1 className="hero-title">ZeroShot Voice Cloning</h1>
        </header>

        <section className="card">
          <label className="section-label">📝 Target Text</label>
          <textarea
            className="text-area"
            rows={5}
            placeholder="Enter the text you want to hear in your voice..."
            value={text}
            onChange={(e) => setText(e.target.value)}
          />
          <div className="field-note">{text.length} characters</div>
        </section>

        <section className="card">
          <div className="card-grid">
            <div className="card-half">
              <label className="section-label">🎧 Upload Voice Sample</label>
              <p className="description">Choose an audio file to use as your voice reference.</p>
              <input
                className="file-input"
                type="file"
                accept="audio/*"
                onChange={(e) => handleFileUpload(e.target.files[0])}
              />
            </div>

            <div className="card-half">
              <label className="section-label">🎤 Record Voice Sample</label>
              <p className="description">Record a sample directly from your microphone.</p>
              <div className="button-row">
                <button className="btn primary-btn" onClick={startRecording} disabled={isRecording}>
                  {isRecording ? "🔴 Recording..." : "Start Recording"}
                </button>
                <button className="btn danger-btn" onClick={stopRecording} disabled={!isRecording}>
                  Stop Recording
                </button>
                <button className="btn secondary-btn" onClick={clearAudio}>
                  Clear Sample
                </button>
              </div>
              {isRecording && (
                <div className="recording-indicator">
                  <span className="recording-dot" />
                  <span>Recording in progress...</span>
                </div>
              )}
            </div>
          </div>
        </section>

        {audioPreviewUrl && (
          <section className="card audio-card">
            <label className="audio-label">✅ Voice Sample Preview</label>
            <audio className="audio-player" controls src={audioPreviewUrl} />
          </section>
        )}

        <section className="card generate-card">
          <button className="btn primary-btn full-width" onClick={generateAudio} disabled={loading || isRecording}>
            {loading ? "✨ Cloning Voice..." : "✨ Generate Cloned Audio"}
          </button>
        </section>

        {errorMessage && (
          <div className="message-box message-error">
            <strong>⚠️ Error:</strong> {errorMessage}
          </div>
        )}

        {successMessage && !loading && (
          <div className="message-box message-success">
            {successMessage}
          </div>
        )}

        {generatedAudio && (
          <section className="card audio-card">
            <label className="audio-label">🎉 Your Cloned Audio</label>
            <audio className="audio-player" controls src={generatedAudio} autoPlay />
            <div className="audio-actions">
              <a className="audio-download" href={generatedAudio} download="cloned-voice.wav">
                ⬇️ Download Audio
              </a>
              <button className="btn secondary-btn" onClick={() => {
                setGeneratedAudio(null);
                setSuccessMessage("");
                setErrorMessage("");
              }}>
                Clear Output
              </button>
            </div>
          </section>
        )}
      </div>
    </div>
  );
}

export default App;



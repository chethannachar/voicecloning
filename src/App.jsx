import { useState, useRef, useEffect } from "react";
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
  const [recordingCompleted, setRecordingCompleted] = useState(false);
  const mediaRecorderRef = useRef(null);
  const chunksRef = useRef([]);
  const [recordingDots, setRecordingDots] = useState("");
  useEffect(() => {
  if (!successMessage && !errorMessage) return;

  const timer = setTimeout(() => {
    setSuccessMessage("");
    setErrorMessage("");
  }, 3000);

  return () => clearTimeout(timer);
  }, [successMessage, errorMessage]);
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
      });

      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];
      setIsRecording(true);
      setRecordingCompleted(false);
      setErrorMessage("");
      setSuccessMessage("");

      mediaRecorder.ondataavailable = (event) => {
        chunksRef.current.push(event.data);
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, {
          type: "audio/wav",
        });

        const file = new File([blob], "recorded.wav", {
          type: "audio/wav",
        });

        const previewUrl = URL.createObjectURL(blob);
        setAudioFile(file);
        setAudioPreviewUrl(previewUrl);
        setIsRecording(false);
        setRecordingCompleted(true);
        setSuccessMessage("Voice sample recorded successfully.");
      };

      mediaRecorder.start();
    } catch (error) {
      console.error(error);
      setIsRecording(false);
      setErrorMessage("Microphone access denied or unsupported browser.");
    }
  };
  useEffect(() => {
  if (!isRecording) {
    setRecordingDots("");
    return;
  }

  const interval = setInterval(() => {
    setRecordingDots((prev) => {
      if (prev === "...") return "";
      return prev + ".";
    });
  }, 500);

  return () => clearInterval(interval);
}, [isRecording]);
  const stopRecording = () => {
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stop();
    }
  };

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

  const clearAudio = () => {
    setAudioFile(null);
    setAudioPreviewUrl(null);
    setRecordingCompleted(false);
    setErrorMessage("");
    setSuccessMessage("Voice sample cleared.");
  };
  const clearOutputAudio = () => {
  setGeneratedAudio(null);
  setSuccessMessage("");
  setErrorMessage("");
};
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
        responseType: "blob",
      });

      const audioUrl = URL.createObjectURL(response.data);
      setGeneratedAudio(audioUrl);
      setErrorMessage("");
      setSuccessMessage("Voice cloning complete! Your audio is ready.");    
    } catch (error) {
      console.error(error);
      const message =
        error.response?.data?.error ||
        error.response?.statusText ||
        error.message ||
        "Generation failed";
      setSuccessMessage("");  
      setErrorMessage(message);
      setGeneratedAudio(null);
    } finally {
      setLoading(false);
    }
  };

  return (
  <div className="app-root">
    <div className="container">

      <header className="hero">
       

        <h1 className="hero-title">
          Zero-Shot Voice Cloning
        </h1>

  <p className="hero-subtitle">
          Clone any voice with just a few seconds of audio.
        </p>

      </header>

      <div className="card">
        <div className="section-header">
          {/*<span className="section-number">1</span>*/}
          <div>
            <h3>Target Text</h3>
          </div>
        </div>

        <textarea
          className="textarea"
          placeholder="Type or paste the text here..."
          value={text}
          onChange={(e) => setText(e.target.value)}
        />

        <div className="char-count">
          {text.length} / 500
        </div>
      </div>

      <div className="card">
        <div className="section-header">
          {/*<span className="section-number">2</span>*/}
          <div>
            <h3>Record Your Voice</h3>
            {/*<p>
              Record a clear sample of the voice you want to clone.
            </p>*/}
          </div>
        </div>

       <div className="record-row">
  <div className="record-controls">

  <button
    className="btn btn-primary"
    onClick={startRecording}
    disabled={isRecording}
  > {isRecording ? `Recording${recordingDots}` : "Record"}</button>

  <button
    className="btn btn-secondary"
    onClick={stopRecording}
    disabled={!isRecording}
  >
      Stop
    </button>

    <button
      className="btn btn-secondary"
      onClick={clearAudio}
      disabled={!recordingCompleted || isRecording}
    >
      Clear
    </button>

  </div>

  {audioPreviewUrl && (
    <audio
      className="audio-player-inline"
      controls
      src={audioPreviewUrl}
    />
  )}
</div>
        <div className="record-tip">
          Recommend recording 5–30 seconds for best results.
        </div>
      </div>

      <button
        className="generate-button"
        onClick={generateAudio}
        disabled={
        loading ||
        isRecording ||
        !recordingCompleted
      }
      >
        {loading
          ? "Generating..."
          : "Generate Cloned Audio"}
      </button>

      <div className="status-wrapper">
        {errorMessage ? (
          <div className="status error">
            {errorMessage}
          </div>
        ) : successMessage ? (
          <div className="status success">
            {successMessage}
          </div>
        ) : null}
      </div>

     <div className="card1">
  <div className="section-header">
    <div>
      <h3>Cloned Output</h3>
    </div>
  </div>

  {generatedAudio ? (
    <div className="output-row">
      <audio
        className="audio-player"
        controls
        src={generatedAudio}
      />

      <button
        className="btn btn-secondary output-clear-btn"
        onClick={clearOutputAudio}
      >
        Clear
      </button>
    </div>
  ) : (
    <div className="output-placeholder">
      Generated audio will appear here
    </div>
  )}
</div>
    </div>
  </div>
);
}

export default App;

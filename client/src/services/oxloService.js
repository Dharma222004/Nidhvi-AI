/**
 * Oxlo AI Integration Example for React Frontend
 *
 * This file demonstrates how to use Oxlo AI models from the frontend
 * Add these functions to your React components or create a new oxloService.js
 */

// API Base URL
const API_BASE_URL =
  process.env.REACT_APP_API_URL || (process.env.NODE_ENV === 'development' ? 'http://localhost:5000' : '');

/**
 * 1. Fast OCR Analysis using gemma-3-4b
 * Use this for quick document scanning
 */
export const analyzeImageWithOxlo = async (file) => {
  const formData = new FormData();
  formData.append("file", file);

  const response = await fetch(`${API_BASE_URL}/api/oxlo/analyze-image`, {
    method: "POST",
    body: formData,
  });

  if (!response.ok) {
    throw new Error("Failed to analyze image with Oxlo");
  }

  return await response.json();
};

/**
 * 2. Audio Transcription using Whisper
 * @param {File} audioFile - Audio file to transcribe
 * @param {string} accuracy - 'medium' or 'large'
 */
export const transcribeAudio = async (audioFile, accuracy = "medium") => {
  const formData = new FormData();
  formData.append("audio", audioFile);
  formData.append("accuracy", accuracy);

  const response = await fetch(`${API_BASE_URL}/api/oxlo/transcribe-audio`, {
    method: "POST",
    body: formData,
  });

  if (!response.ok) {
    throw new Error("Failed to transcribe audio");
  }

  const result = await response.json();
  return result.transcription;
};

/**
 * 3. Text-to-Speech using kokoro-82m
 * Creates audio version of patient explanation
 */
export const generateSpeechAudio = async (text, options = {}) => {
  const response = await fetch(`${API_BASE_URL}/api/oxlo/text-to-speech`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      text,
      voice: options.voice || "default",
      speed: options.speed || 1.0,
    }),
  });

  if (!response.ok) {
    throw new Error("Failed to generate speech");
  }

  return await response.json();
};

/**
 * 4. Universal Processing with Auto-Model Selection
 */
export const processWithOxlo = async (taskType, data, options = {}) => {
  const formData = new FormData();
  formData.append("taskType", taskType);

  if (data.file) {
    formData.append("file", data.file);
  }
  if (data.text) {
    formData.append("text", data.text);
  }
  if (options) {
    formData.append("options", JSON.stringify(options));
  }

  const response = await fetch(`${API_BASE_URL}/api/oxlo/process`, {
    method: "POST",
    body: formData,
  });

  if (!response.ok) {
    throw new Error("Failed to process with Oxlo");
  }

  return await response.json();
};

/**
 * 5. Get Available Models
 */
export const getOxloModels = async () => {
  const response = await fetch(`${API_BASE_URL}/api/oxlo/models`);

  if (!response.ok) {
    throw new Error("Failed to fetch Oxlo models");
  }

  return await response.json();
};

/**
 * 6. Check Oxlo Health
 */
export const checkOxloHealth = async () => {
  const response = await fetch(`${API_BASE_URL}/api/oxlo/health`);

  if (!response.ok) {
    throw new Error("Failed to check Oxlo health");
  }

  return await response.json();
};

// ============================================================
// REACT COMPONENT EXAMPLES
// ============================================================

/**
 * Example 1: Quick OCR Button Component
 */
export const QuickOCRButton = ({ file, onResult }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleQuickScan = async () => {
    setLoading(true);
    setError(null);

    try {
      const result = await analyzeImageWithOxlo(file);
      onResult(result.data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <button
        onClick={handleQuickScan}
        disabled={!file || loading}
        className="quick-ocr-button"
      >
        {loading ? "⚡ Scanning..." : "⚡ Quick Scan (Oxlo OCR)"}
      </button>
      {error && <div className="error">{error}</div>}
    </div>
  );
};

/**
 * Example 2: Audio Transcription Component
 */
export const AudioTranscriber = () => {
  const [audioFile, setAudioFile] = useState(null);
  const [transcription, setTranscription] = useState("");
  const [loading, setLoading] = useState(false);
  const [accuracy, setAccuracy] = useState("medium");

  const handleTranscribe = async () => {
    if (!audioFile) return;

    setLoading(true);
    try {
      const text = await transcribeAudio(audioFile, accuracy);
      setTranscription(text);
    } catch (err) {
      console.error("Transcription failed:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="audio-transcriber">
      <h3>🎤 Medical Audio Transcription</h3>

      <input
        type="file"
        accept="audio/*"
        onChange={(e) => setAudioFile(e.target.files[0])}
      />

      <div>
        <label>
          <input
            type="radio"
            value="medium"
            checked={accuracy === "medium"}
            onChange={(e) => setAccuracy(e.target.value)}
          />
          Fast (Whisper Medium)
        </label>
        <label>
          <input
            type="radio"
            value="large"
            checked={accuracy === "large"}
            onChange={(e) => setAccuracy(e.target.value)}
          />
          High Accuracy (Whisper Large)
        </label>
      </div>

      <button onClick={handleTranscribe} disabled={!audioFile || loading}>
        {loading ? "Transcribing..." : "Transcribe Audio"}
      </button>

      {transcription && (
        <div className="transcription-result">
          <h4>Transcription:</h4>
          <p>{transcription}</p>
        </div>
      )}
    </div>
  );
};

/**
 * Example 3: Text-to-Speech Player Component
 */
export const SpeakButton = ({ text }) => {
  const [audioUrl, setAudioUrl] = useState(null);
  const [loading, setLoading] = useState(false);
  const [playing, setPlaying] = useState(false);
  const audioRef = useRef(null);

  const handleSpeak = async () => {
    setLoading(true);
    try {
      const result = await generateSpeechAudio(text, { speed: 0.9 });

      // Assuming the result contains base64 or URL
      // Adjust based on actual API response
      const audioData = result.audio;
      setAudioUrl(audioData);

      // Auto-play
      if (audioRef.current) {
        audioRef.current.play();
        setPlaying(true);
      }
    } catch (err) {
      console.error("TTS failed:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="speak-button-container">
      <button
        onClick={handleSpeak}
        disabled={!text || loading}
        className="speak-button"
      >
        {loading ? "🔊 Generating..." : playing ? "🔊 Playing" : "🔊 Listen"}
      </button>

      {audioUrl && (
        <audio
          ref={audioRef}
          src={audioUrl}
          onEnded={() => setPlaying(false)}
          controls
        />
      )}
    </div>
  );
};

/**
 * Example 4: Enhanced File Upload with Oxlo OCR Option
 */
export const EnhancedFileUpload = ({ onAnalysisComplete }) => {
  const [file, setFile] = useState(null);
  const [useOxloOCR, setUseOxloOCR] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleAnalyze = async () => {
    if (!file) return;

    setLoading(true);
    try {
      let result;

      if (useOxloOCR) {
        // Use Oxlo's fast OCR
        result = await analyzeImageWithOxlo(file);
      } else {
        // Use existing Gemini analysis
        // Your existing analysis code here
      }

      onAnalysisComplete(result);
    } catch (err) {
      console.error("Analysis failed:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="enhanced-upload">
      <input
        type="file"
        onChange={(e) => setFile(e.target.files[0])}
        accept="image/*,application/pdf"
      />

      <div className="analysis-options">
        <h4>Analysis Method:</h4>
        <label>
          <input
            type="checkbox"
            checked={useOxloOCR}
            onChange={(e) => setUseOxloOCR(e.target.checked)}
          />
          ⚡ Use Fast OCR (Oxlo gemma-3-4b)
          <small>Faster processing, good for quick scans</small>
        </label>
      </div>

      <button onClick={handleAnalyze} disabled={!file || loading}>
        {loading
          ? "Analyzing..."
          : useOxloOCR
            ? "⚡ Quick Analyze"
            : "Analyze Report"}
      </button>
    </div>
  );
};

/**
 * Example 5: Accessibility Features with TTS
 */
export const AccessibleExplanation = ({ explanation }) => {
  const [isSpeaking, setIsSpeaking] = useState(false);

  const speakExplanation = async () => {
    setIsSpeaking(true);
    try {
      const audio = await generateSpeechAudio(explanation.summary, {
        speed: 0.9, // Slightly slower for clarity
      });

      // Play the audio
      const audioElement = new Audio(audio.audio);
      audioElement.onended = () => setIsSpeaking(false);
      audioElement.play();
    } catch (err) {
      console.error("Failed to speak:", err);
      setIsSpeaking(false);
    }
  };

  return (
    <div className="accessible-explanation">
      <div className="explanation-text">{explanation.summary}</div>

      <button
        onClick={speakExplanation}
        disabled={isSpeaking}
        className="accessibility-button"
        aria-label="Read explanation aloud"
      >
        {isSpeaking ? "🔊 Speaking..." : "🔊 Read Aloud"}
      </button>
    </div>
  );
};

// ============================================================
// USAGE IN YOUR APP
// ============================================================

/**
 * How to integrate into your existing FileUpload component:
 *
 * 1. Import the functions:
 *    import { analyzeImageWithOxlo, generateSpeechAudio } from './oxloService';
 *
 * 2. Add quick scan option:
 *    <button onClick={() => analyzeImageWithOxlo(file)}>
 *      ⚡ Quick Scan
 *    </button>
 *
 * 3. Add accessibility audio:
 *    <SpeakButton text={patientExplanation.summary} />
 *
 * 4. Add audio transcription:
 *    <AudioTranscriber />
 */

export default {
  analyzeImageWithOxlo,
  transcribeAudio,
  generateSpeechAudio,
  processWithOxlo,
  getOxloModels,
  checkOxloHealth,
};

# Oxlo AI Integration Guide

## Overview
The Healthcare Report Explainer now integrates with **Oxlo AI** to provide specialized AI models for various tasks:

### Available Oxlo Models

| Model | Task | Use Cases |
|-------|------|-----------|
| **whisper-medium** | Audio Analysis | Quick transcription, audio dictation |
| **whisper-large** | High-Accuracy Speech Recognition | Professional transcription, critical medical dictation |
| **kokoro-82m** | Text-to-Speech | Patient explanation audio, accessibility features |
| **gemma-3-4b** | Fast Image OCR | Quick report scanning, document digitization, OCR extraction |

## API Endpoints

### Base URL
All Oxlo endpoints are available at: `http://localhost:5000/api/oxlo`

---

### 1. Image OCR Analysis
**Endpoint:** `POST /api/oxlo/analyze-image`

Upload a medical report image for fast OCR and analysis using the gemma-3-4b model.

**Request:**
```bash
curl -X POST http://localhost:5000/api/oxlo/analyze-image \
  -F "file=@report.jpg"
```

**Response:**
```json
{
  "success": true,
  "provider": "oxlo",
  "model": "gemma-3-4b",
  "data": {
    "reportType": "Lab Report",
    "findings": [...],
    "measurements": [...]
  },
  "timestamp": "2026-01-16T21:56:27.000Z"
}
```

---

### 2. Audio Transcription
**Endpoint:** `POST /api/oxlo/transcribe-audio`

Transcribe medical audio dictation using Whisper models.

**Request:**
```bash
curl -X POST http://localhost:5000/api/oxlo/transcribe-audio \
  -F "audio=@dictation.mp3" \
  -F "accuracy=large"
```

**Parameters:**
- `audio`: Audio file (mp3, wav, etc.)
- `accuracy`: "medium" (faster) or "large" (more accurate)

**Response:**
```json
{
  "success": true,
  "provider": "oxlo",
  "model": "whisper-large",
  "transcription": "Patient presents with...",
  "timestamp": "2026-01-16T21:56:27.000Z"
}
```

---

### 3. Text-to-Speech
**Endpoint:** `POST /api/oxlo/text-to-speech`

Convert patient explanations to audio using the kokoro-82m model.

**Request:**
```bash
curl -X POST http://localhost:5000/api/oxlo/text-to-speech \
  -H "Content-Type: application/json" \
  -d '{
    "text": "Your chest X-ray shows normal findings...",
    "voice": "default",
    "speed": 1.0
  }'
```

**Response:**
```json
{
  "success": true,
  "provider": "oxlo",
  "model": "kokoro-82m",
  "audio": "...",
  "timestamp": "2026-01-16T21:56:27.000Z"
}
```

---

### 4. Universal Processing (Auto-Model Selection)
**Endpoint:** `POST /api/oxlo/process`

Smart endpoint that automatically selects the right model based on task type.

**For OCR:**
```bash
curl -X POST http://localhost:5000/api/oxlo/process \
  -F "file=@report.jpg" \
  -F "taskType=ocr"
```

**For Audio:**
```bash
curl -X POST http://localhost:5000/api/oxlo/process \
  -F "file=@audio.mp3" \
  -F "taskType=transcribe" \
  -F "options[accuracy]=large"
```

**For TTS:**
```bash
curl -X POST http://localhost:5000/api/oxlo/process \
  -H "Content-Type: application/json" \
  -d '{
    "taskType": "tts",
    "text": "Your report explanation..."
  }'
```

---

### 5. Get Available Models
**Endpoint:** `GET /api/oxlo/models`

Retrieve information about all available Oxlo models and their capabilities.

**Request:**
```bash
curl http://localhost:5000/api/oxlo/models
```

**Response:**
```json
{
  "success": true,
  "configured": true,
  "models": {
    "audioAnalysis": {
      "name": "whisper-medium",
      "description": "Medium accuracy audio analysis and transcription",
      "useCases": ["Quick transcription", "Audio dictation"]
    },
    "textToSpeech": {
      "name": "kokoro-82m",
      "description": "Natural text-to-speech generation",
      "useCases": ["Patient explanation audio", "Accessibility features"]
    },
    "imageOCR": {
      "name": "gemma-3-4b",
      "description": "Fast image analysis and OCR for document processing",
      "useCases": ["Quick report scanning", "Document digitization", "OCR extraction"]
    },
    "speechRecognition": {
      "name": "whisper-large",
      "description": "High accuracy speech recognition for professional transcription",
      "useCases": ["Professional transcription", "Critical medical dictation"]
    }
  }
}
```

---

### 6. Health Check
**Endpoint:** `GET /api/oxlo/health`

Check Oxlo API connectivity and configuration status.

**Request:**
```bash
curl http://localhost:5000/api/oxlo/health
```

**Response:**
```json
{
  "success": true,
  "status": "healthy",
  "configured": true,
  "endpoint": "https://api.oxlo.ai/v1/chat/completions",
  "models": {
    "audio": "whisper-medium",
    "tts": "kokoro-82m",
    "imageOCR": "gemma-3-4b",
    "speech": "whisper-large"
  },
  "timestamp": "2026-01-16T21:56:27.000Z"
}
```

---

## Configuration

### Environment Variables

Add these to your `.env` file:

```bash
# Oxlo AI Configuration
OXLO_API_KEY=sk_XYHTBKI41OwlwpLDLWJcHiviktC7gD783Q3fOJtTdK0
OXLO_API_ENDPOINT=https://api.oxlo.ai/v1/chat/completions

# Model Selection
OXLO_MODEL_AUDIO=whisper-medium
OXLO_MODEL_TTS=kokoro-82m
OXLO_MODEL_IMAGE_OCR=gemma-3-4b
OXLO_MODEL_SPEECH=whisper-large
```

---

## Usage Examples

### Example 1: Quick Report Scanning with OCR
Perfect for rapid digitization of paper reports:

```javascript
const FormData = require('form-data');
const fs = require('fs');
const axios = require('axios');

const form = new FormData();
form.append('file', fs.createReadStream('xray.jpg'));

const response = await axios.post(
  'http://localhost:5000/api/oxlo/analyze-image',
  form,
  {
    headers: form.getHeaders()
  }
);

console.log('OCR Result:', response.data);
```

### Example 2: Medical Dictation Transcription
Convert doctor's voice notes to text:

```javascript
const form = new FormData();
form.append('audio', fs.createReadStream('dictation.mp3'));
form.append('accuracy', 'large'); // Use whisper-large for critical notes

const response = await axios.post(
  'http://localhost:5000/api/oxlo/transcribe-audio',
  form,
  {
    headers: form.getHeaders()
  }
);

console.log('Transcription:', response.data.transcription);
```

### Example 3: Patient Education Audio
Create audio explanations for patients:

```javascript
const response = await axios.post(
  'http://localhost:5000/api/oxlo/text-to-speech',
  {
    text: 'Your blood test results are normal. Your hemoglobin is at 14.5 g/dL, which is within the healthy range...',
    voice: 'default',
    speed: 0.9 // Slightly slower for clarity
  }
);

// Save audio file
fs.writeFileSync('explanation.mp3', response.data.audio);
```

---

## Integration with Existing Features

### Hybrid Processing
You can use both Gemini and Oxlo together:

1. **Gemini** for complex medical analysis and reasoning
2. **Oxlo gemma-3-4b** for fast OCR extraction
3. **Oxlo whisper-large** for critical audio transcription
4. **Oxlo kokoro-82m** for accessibility features

### When to Use Which Model

| Scenario | Recommended Model | Why |
|----------|------------------|-----|
| Quick scan of multiple reports | Oxlo gemma-3-4b | Fast, cost-effective OCR |
| Complex diagnostic reasoning | Gemini | Advanced AI capabilities |
| Doctor's audio notes | Oxlo whisper-large | High accuracy medical terms |
| Quick voice memos | Oxlo whisper-medium | Faster, good enough |
| Patient education audio | Oxlo kokoro-82m | Natural TTS |

---

## Error Handling

All endpoints return consistent error responses:

```json
{
  "success": false,
  "error": "Oxlo API request failed: Invalid API key"
}
```

Common errors:
- `No file uploaded` - Missing file in request
- `Invalid task type` - Unknown taskType parameter
- `Oxlo API request failed` - API connectivity issue
- `Oxlo API key not configured` - Missing OXLO_API_KEY in .env

---

## Testing

Test the Oxlo integration:

```bash
# 1. Check health
curl http://localhost:5000/api/oxlo/health

# 2. Get available models
curl http://localhost:5000/api/oxlo/models

# 3. Test with a sample image
curl -X POST http://localhost:5000/api/oxlo/analyze-image \
  -F "file=@test-report.jpg"
```

---

## Performance Considerations

### Speed Comparison
- **gemma-3-4b**: ~2-3 seconds for typical report
- **whisper-medium**: ~5-10 seconds for 1 minute audio
- **whisper-large**: ~10-20 seconds for 1 minute audio
- **kokoro-82m**: ~3-5 seconds for 100 words

### Cost Optimization
- Use **whisper-medium** for non-critical transcriptions
- Use **gemma-3-4b** for bulk OCR processing
- Reserve **whisper-large** for important medical dictations

---

## Frontend Integration

### React Example
```javascript
// Upload and analyze with Oxlo
const analyzeWithOxlo = async (file) => {
  const formData = new FormData();
  formData.append('file', file);
  
  const response = await fetch('http://localhost:5000/api/oxlo/analyze-image', {
    method: 'POST',
    body: formData
  });
  
  const result = await response.json();
  return result.data;
};

// Text-to-speech for accessibility
const speakExplanation = async (text) => {
  const response = await fetch('http://localhost:5000/api/oxlo/text-to-speech', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text, speed: 0.9 })
  });
  
  const result = await response.json();
  // Play audio
  const audio = new Audio(result.audio);
  audio.play();
};
```

---

## Next Steps

1. **Test the endpoints** using curl or Postman
2. **Integrate into your frontend** for enhanced features
3. **Monitor usage** and optimize model selection
4. **Add error handling** for production use
5. **Consider caching** frequently accessed transcriptions

For more information, visit the [Oxlo AI Documentation](https://api.oxlo.ai/docs)

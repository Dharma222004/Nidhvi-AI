# Healthcare Imaging/Lab Report Explainer

An AI-powered web application that analyzes medical reports (radiology and lab results) and generates clear, understandable explanations in two modes:

- **Patient Mode**: Simple, friendly language with actionable guidance
- **Clinician Mode**: Concise clinical summaries with critical values and differential diagnoses

![Healthcare Report Explainer](docs/screenshot.png)

## 🌟 Features

### Core Functionality
- ✅ **File Upload**: Drag-and-drop support for PDF and image files
- ✅ **Text Input**: Paste report text directly for analysis
- ✅ **Dual-Mode Explanations**: Toggle between patient-friendly and clinician-focused outputs
- ✅ **AI-Powered Analysis**: Uses Google Gemini API for intelligent extraction and explanation
- ✅ **Red Flag Detection**: Automatically identifies critical values requiring attention
- ✅ **Citations**: References to authoritative medical sources

### Safety & Compliance
- ✅ **Clear Disclaimers**: Prominent notices that this is not medical advice
- ✅ **Critical Value Alerts**: Urgent warnings for findings requiring immediate attention
- ✅ **Privacy-First**: Files processed securely, not stored permanently

### Accessibility
- ✅ **WCAG 2.1 AA Compliant**: Screen reader friendly with ARIA labels
- ✅ **Keyboard Navigation**: Full functionality without a mouse
- ✅ **High Contrast Mode**: Toggle for improved visibility
- ✅ **Adjustable Font Size**: Small, normal, and large text options
- ✅ **Mobile Responsive**: Works on all device sizes

### Export Options
- ✅ **JSON Export**: Structured data for integration
- ✅ **CSV Export**: Spreadsheet-compatible format
- ✅ **FHIR Export**: HL7 FHIR-compliant DiagnosticReport format

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ 
- npm or yarn
- Google Gemini API key ([Get one here](https://makersuite.google.com/))

### Installation

1. **Clone the repository**
   ```bash
   cd healthcare-report-explainer
   ```

2. **Set up the backend**
   ```bash
   cd server
   cp .env.example .env
   # Edit .env and add your GEMINI_API_KEY
   npm install
   ```

3. **Set up the frontend**
   ```bash
   cd ../client
   npm install
   ```

4. **Start the development servers**

   In one terminal (backend):
   ```bash
   cd server
   npm run dev
   ```

   In another terminal (frontend):
   ```bash
   cd client
   npm start
   ```

5. **Open the application**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:5000

## 📁 Project Structure

```
healthcare-report-explainer/
├── client/                     # React frontend
│   ├── public/
│   │   └── index.html
│   ├── src/
│   │   ├── components/         # React components
│   │   │   ├── Header.js
│   │   │   ├── FileUpload.js
│   │   │   ├── ModeToggle.js
│   │   │   ├── ResultsPanel.js
│   │   │   ├── PatientExplanation.js
│   │   │   ├── ClinicianExplanation.js
│   │   │   ├── CitationsPanel.js
│   │   │   ├── SafetyAlerts.js
│   │   │   ├── DisclaimerBanner.js
│   │   │   ├── LoadingOverlay.js
│   │   │   └── TextInputModal.js
│   │   ├── services/
│   │   │   └── api.js          # API client
│   │   ├── App.js
│   │   ├── index.js
│   │   └── index.css           # Tailwind + custom styles
│   ├── package.json
│   ├── tailwind.config.js
│   └── postcss.config.js
│
├── server/                     # Express backend
│   ├── routes/
│   │   ├── analyze.js          # Report analysis endpoints
│   │   ├── reports.js          # Report retrieval/export
│   │   └── health.js           # Health check endpoints
│   ├── services/
│   │   ├── geminiService.js    # Gemini AI integration
│   │   └── safetyService.js    # Disclaimers & red flags
│   ├── uploads/                # Temporary file storage
│   ├── index.js                # Express server
│   ├── package.json
│   └── .env.example
│
├── sample-reports/             # Synthetic test reports
├── docs/                       # Documentation
└── README.md
```

## 🔧 API Documentation

### Endpoints

#### POST /api/analyze
Analyze a medical report file.

**Request:**
- Content-Type: `multipart/form-data`
- Body:
  - `file`: PDF or image file
  - `mode`: `patient` or `clinician`
  - `language`: `en`, `ta`, or `hi` (optional)

**Response:**
```json
{
  "success": true,
  "reportId": "uuid",
  "reportType": "radiology",
  "reportSubtype": "Chest X-Ray",
  "extraction": {
    "findings": [...],
    "measurements": [...],
    "impressions": [...]
  },
  "explanation": {...},
  "redFlags": [...],
  "citations": [...],
  "disclaimers": [...]
}
```

#### POST /api/analyze/text
Analyze report text directly.

#### POST /api/analyze/switch-mode
Switch explanation mode for cached report.

#### GET /api/reports/:id
Retrieve cached report.

#### GET /api/reports/:id/export?format=json|csv|fhir
Export report in specified format.

#### GET /api/health
System health check.

## 🎨 Design System

### Color Palette
- **Primary**: Sky blue (#0ea5e9) - Trust, calm, healthcare
- **Success**: Green (#22c55e) - Normal findings
- **Warning**: Yellow (#f59e0b) - Findings to discuss
- **Danger**: Red (#ef4444) - Critical values
- **Surface**: Slate grays - Dark mode UI

### Typography
- **Headlines**: Inter (600-700 weight)
- **Body**: Inter (400-500 weight)
- **Code/Data**: JetBrains Mono

## 🧪 Testing

### Sample Reports
The application includes built-in sample reports for testing:
- Normal Chest X-Ray
- CBC with mild anemia
- CT Abdomen showing appendicitis

### Run Tests
```bash
# Backend tests
cd server
npm test

# Frontend tests
cd client
npm test
```

## 🔐 Environment Variables

### Backend (.env)
```bash
# Required
GEMINI_API_KEY=your_gemini_api_key

# Optional
PORT=5000
NODE_ENV=development
FRONTEND_URL=http://localhost:3000
MAX_FILE_SIZE_MB=10
```

## 🚀 Deployment

### Docker
```bash
docker-compose up -d
```

### Cloud Run (Google Cloud)
```bash
# Build and deploy backend
gcloud run deploy healthcare-api --source ./server

# Deploy frontend to Firebase Hosting
cd client && npm run build
firebase deploy --only hosting
```

## ⚠️ Important Disclaimers

1. **Not Medical Advice**: This tool is for educational purposes only and does not provide medical diagnoses.

2. **Consult Healthcare Providers**: Always consult qualified healthcare professionals for medical decisions.

3. **AI Limitations**: The AI may not capture all nuances and may make errors. Always verify with original reports.

4. **Privacy**: While designed for privacy, avoid uploading reports with sensitive identifying information in demo mode.

## 📄 License

MIT License - See LICENSE file for details.

## 🙏 Acknowledgments

- Google Gemini AI for natural language processing
- RSNA, ACR, SNOMED, LOINC for medical standards
- React and TailwindCSS communities

---

Built with ❤️ for better healthcare understanding

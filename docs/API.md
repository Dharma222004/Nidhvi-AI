# Healthcare Report Explainer - API Documentation

## Overview

The Healthcare Report Explainer API provides endpoints for analyzing medical reports (radiology and lab results) using AI-powered extraction and explanation generation.

**Base URL:** `http://localhost:5000/api`

## Authentication

Currently, the API does not require authentication for development purposes. In production, implement JWT-based authentication.

## Rate Limiting

- 100 requests per 15 minutes per IP address
- File uploads limited to 10MB

## Endpoints

---

### POST /api/analyze

Analyze a medical report file (PDF or image).

#### Request

**Headers:**
```
Content-Type: multipart/form-data
```

**Body (form-data):**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| file | File | Yes | PDF or image file (JPEG, PNG, WebP) |
| mode | string | No | `patient` or `clinician` (default: `patient`) |
| language | string | No | `en`, `ta`, or `hi` (default: `en`) |

#### Response

```json
{
  "success": true,
  "reportId": "550e8400-e29b-41d4-a716-446655440000",
  "processingTimeMs": 2340,
  "mode": "patient",
  "language": "en",
  "reportType": "radiology",
  "reportSubtype": "Chest X-Ray",
  "extraction": {
    "findings": [
      {
        "finding": "Clear lung fields bilaterally",
        "location": "Lungs",
        "severity": "normal",
        "isCritical": false
      }
    ],
    "measurements": [
      {
        "item": "Cardiothoracic ratio",
        "value": "0.45",
        "unit": "",
        "referenceRange": "<0.50",
        "status": "normal"
      }
    ],
    "impressions": [
      "Normal chest radiograph",
      "No acute cardiopulmonary findings"
    ],
    "recommendations": ["No follow-up needed"],
    "patientInfo": {
      "age": null,
      "gender": null
    },
    "dateOfStudy": "2024-01-15"
  },
  "explanation": {
    // Patient mode explanation object
  },
  "redFlags": [],
  "hasCriticalValues": false,
  "needsEscalation": false,
  "safetyWarnings": [
    {
      "level": "info",
      "title": "Remember",
      "message": "...",
      "icon": "ℹ️"
    }
  ],
  "citations": [
    {
      "id": "citation-1",
      "title": "ACR–SPR–STR Practice Parameter for the Performance of Chest Radiography",
      "source": "American College of Radiology",
      "type": "guideline",
      "url": "https://www.acr.org/...",
      "relevance": "Standard guidelines for chest X-ray interpretation",
      "accessDate": "2024"
    }
  ],
  "terminologyCodes": [
    {
      "term": "Chest X-Ray",
      "code": "71046",
      "system": "CPT"
    }
  ],
  "disclaimers": [
    {
      "id": "disclaimer-general",
      "title": "Important Notice",
      "text": "This analysis is provided for educational purposes only...",
      "priority": "high"
    }
  ],
  "metadata": {
    "fileName": "chest_xray.pdf",
    "fileSize": 245678,
    "processedAt": "2024-01-15T10:30:00Z"
  }
}
```

---

### POST /api/analyze/text

Analyze report from text input.

#### Request

**Headers:**
```
Content-Type: application/json
```

**Body:**
```json
{
  "reportText": "CHEST X-RAY (PA AND LATERAL)\n\nFINDINGS: ...",
  "mode": "patient",
  "language": "en"
}
```

#### Response

Same as `/api/analyze`

---

### POST /api/analyze/switch-mode

Switch explanation mode for a cached report.

#### Request

```json
{
  "reportId": "550e8400-e29b-41d4-a716-446655440000",
  "newMode": "clinician"
}
```

#### Response

```json
{
  "success": true,
  "reportId": "550e8400-e29b-41d4-a716-446655440000",
  "mode": "clinician",
  "explanation": {
    // Clinician mode explanation object
  }
}
```

---

### GET /api/reports/:id

Retrieve a previously analyzed report.

#### Response

```json
{
  "success": true,
  "report": {
    // Full report object
  }
}
```

---

### GET /api/reports/:id/export

Export report in specified format.

#### Query Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| format | string | `json`, `csv`, or `fhir` |

#### Response

Returns file download with appropriate content type.

---

### GET /api/reports

List all cached reports (demo purposes).

#### Response

```json
{
  "success": true,
  "count": 5,
  "reports": [
    {
      "reportId": "...",
      "reportType": "radiology",
      "reportSubtype": "Chest X-Ray",
      "mode": "patient",
      "hasCriticalValues": false,
      "processedAt": "2024-01-15T10:30:00Z"
    }
  ]
}
```

---

### GET /api/health

System health check.

#### Response

```json
{
  "status": "healthy",
  "timestamp": "2024-01-15T10:30:00Z",
  "uptime": 3600,
  "version": "1.0.0",
  "services": {
    "gemini": {
      "status": "connected",
      "error": null
    }
  },
  "memory": {
    "heapUsed": "45MB",
    "heapTotal": "80MB",
    "rss": "120MB"
  }
}
```

---

## Data Models

### Patient Mode Explanation

```json
{
  "summary": "Brief overview in simple terms",
  "explanation": "Detailed explanation (150-300 words)",
  "whatItMeans": "What results mean for patient's health",
  "normalFindings": ["List of normal findings"],
  "findingsToDiscuss": [
    {
      "finding": "Description",
      "whatItMeans": "Lay explanation",
      "importance": "low|medium|high"
    }
  ],
  "whenToContactDoctor": ["Symptom to watch"],
  "nextSteps": ["Action item 1", "Action item 2"],
  "questionsForDoctor": ["Question 1", "Question 2"],
  "reassurance": "Supportive closing message"
}
```

### Clinician Mode Explanation

```json
{
  "clinicalSummary": "One-paragraph synopsis",
  "findingsSummary": ["Key finding 1", "Key finding 2"],
  "criticalValues": [
    {
      "value": "Critical finding",
      "interpretation": "Clinical interpretation",
      "urgency": "immediate|urgent|routine",
      "action": "Suggested action"
    }
  ],
  "abnormalFindings": [
    {
      "finding": "Description",
      "significance": "Clinical significance",
      "trend": "improving|stable|worsening|new|unknown"
    }
  ],
  "differentialDiagnosis": [
    {
      "diagnosis": "DDx 1",
      "likelihood": "high|medium|low",
      "supportingFindings": ["Finding 1"]
    }
  ],
  "suggestedNextSteps": [
    {
      "action": "Recommended action",
      "rationale": "Evidence-based rationale",
      "timeframe": "immediate|days|weeks|routine"
    }
  ],
  "guidelineReferences": [
    {
      "guideline": "Guideline name",
      "source": "Organization",
      "relevance": "How it applies"
    }
  ],
  "clinicalPearls": ["Clinical insight"]
}
```

---

## Error Responses

```json
{
  "success": false,
  "error": "Error message",
  "processingTimeMs": 150
}
```

### HTTP Status Codes

| Code | Description |
|------|-------------|
| 200 | Success |
| 400 | Bad request (invalid input) |
| 404 | Report not found |
| 429 | Rate limit exceeded |
| 500 | Server error |

---

## Code Examples

### JavaScript/Fetch

```javascript
// Analyze file
const formData = new FormData();
formData.append('file', file);
formData.append('mode', 'patient');

const response = await fetch('/api/analyze', {
  method: 'POST',
  body: formData
});
const result = await response.json();
```

### Python

```python
import requests

# Analyze file
files = {'file': open('report.pdf', 'rb')}
data = {'mode': 'patient'}
response = requests.post('http://localhost:5000/api/analyze', 
                         files=files, data=data)
result = response.json()
```

### cURL

```bash
# Analyze file
curl -X POST http://localhost:5000/api/analyze \
  -F "file=@report.pdf" \
  -F "mode=patient"

# Analyze text
curl -X POST http://localhost:5000/api/analyze/text \
  -H "Content-Type: application/json" \
  -d '{"reportText": "CHEST X-RAY...", "mode": "patient"}'
```

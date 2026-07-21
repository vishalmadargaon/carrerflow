# AI-Powered Resume Tailoring Application - System Architecture

## 1. System Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                     React Frontend (Vite)                        │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │ Pages: Upload → SkillSelection → Review(Diff) → Download │   │
│  │ State: Redux Toolkit or Zustand (Resume, Skills, Diffs)  │   │
│  └──────────────────────────────────────────────────────────┘   │
└────────────────────────┬────────────────────────────────────────┘
                         │ REST API / Streaming
┌────────────────────────▼────────────────────────────────────────┐
│              Node.js/Express Backend                            │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │ Routes:                                                  │   │
│  │ POST /api/parse-resume → PDF/DOCX → JSON structure     │   │
│  │ POST /api/extract-skills → LLM skill analysis          │   │
│  │ POST /api/rewrite-bullets → LLM bullet generation      │   │
│  │ POST /api/generate-pdf → JSON structure → PDF file     │   │
│  └──────────────────────────────────────────────────────────┘   │
└────────────┬──────────────┬──────────────┬──────────────────────┘
             │              │              │
    ┌────────▼──┐  ┌────────▼──┐  ┌───────▼──────┐
    │   Gemini   │  │ PDF/DOCX  │  │   Firebase/  │
    │   API      │  │  Parser   │  │   Supabase   │
    │ (LLM)      │  │ (Pdfjs +  │  │   (Storage)  │
    │            │  │  Mammoth) │  │              │
    └────────────┘  └───────────┘  └──────────────┘
```

## 2. Document Parsing Architecture

### Challenge: Preserve Formatting While Enabling Edits

The key insight is to **decouple content from layout**:

```json
{
  "originalDocument": {
    "format": "pdf",
    "metadata": { "author": "...", "createdDate": "..." },
    "pages": [...]
  },
  "structuredContent": {
    "sections": [
      {
        "type": "heading",
        "text": "PROFESSIONAL SUMMARY",
        "originalFormat": { "fontSize": 12, "bold": true }
      },
      {
        "type": "bullet",
        "text": "Developed scalable applications",
        "parentSection": "WORK EXPERIENCE",
        "index": 0,
        "originalFormat": { ... }
      }
    ]
  },
  "editableElements": {
    "bullet_0": {
      "originalText": "Developed scalable applications",
      "suggestedText": "Led development of high-performance distributed systems",
      "status": "pending", // pending | accepted | rejected
      "skillsHighlighted": ["Distributed Systems"]
    }
  }
}
```

### Processing Pipeline:

1. **Extract** (PDF/DOCX → JSON)
   - Use pdfjs for PDF or Mammoth for DOCX
   - Preserve text position, formatting metadata
   - Identify structure: headings, bullets, paragraphs

2. **Transform** (JSON structure → editable format)
   - Map content to bullet-point objects
   - Track original formatting and position
   - Create index for fast lookup

3. **Modify** (Add AI suggestions)
   - LLM rewrites specific bullets
   - Store original + suggested text
   - Track which skills are highlighted

4. **Render** (Display in UI)
   - Diff view: old text (strikethrough), new text (green)
   - Interactive tooltips: Accept/Reject/Edit
   - Real-time update on user action

5. **Export** (JSON → PDF/HTML+CSS)
   - Reconstruct using original formatting metadata
   - Apply user-accepted changes
   - Generate final PDF using Puppeteer/Playwright

## 3. Data Flow Diagram

```
User Upload
    │
    ▼
Parse Document (Backend)
    │
    ├─ Extract text + formatting
    ├─ Identify sections & bullets
    └─ Return structured JSON
    │
    ▼
Skill Extraction (Gemini API)
    │
    ├─ Input: Resume JSON + Job Description
    ├─ LLM output: [skill1, skill2, ...]
    └─ Frontend: Display clickable pills
    │
    ▼
User Selects Skills
    │
    ├─ State: selectedSkills = [...]
    └─ Send to backend
    │
    ▼
Bullet Rewriting (Gemini API)
    │
    ├─ For each bullet: call LLM
    ├─ Prompt: "Rewrite emphasizing skills: [...]"
    ├─ Output: { originalText, suggestedText, skills }
    └─ Store all variations
    │
    ▼
Review UI (Frontend)
    │
    ├─ Display diff for each bullet
    ├─ User: Accept/Reject/Edit each one
    └─ Track user decisions
    │
    ▼
Export (Backend)
    │
    ├─ Reconstruct resume with accepted changes
    ├─ Preserve original formatting
    └─ Generate final PDF
    │
    ▼
Download
```

## 4. Resume JSON Structure (Core Data Model)

```typescript
interface ResumeBulletPoint {
  id: string; // unique identifier
  originalText: string; // immutable original
  parentSection: string; // "WORK EXPERIENCE", "SKILLS", etc.
  sectionIndex: number; // position within section
  formatting: {
    fontSize: number;
    bold: boolean;
    italic: boolean;
    color?: string;
    indent?: number;
  };
}

interface ResumeDiff {
  bulletId: string;
  originalText: string;
  suggestedText: string; // AI-generated
  status: 'pending' | 'accepted' | 'rejected' | 'editing';
  userEditedText?: string; // if user manually edited
  skillsHighlighted: string[]; // e.g., ["Distributed Systems", "Python"]
  highlightedIndices: Array<{ skill: string; start: number; end: number }>;
}

interface ResumeState {
  rawResumeText: string;
  parsedBullets: ResumeBulletPoint[];
  jobDescription: string;
  extractedSkills: string[]; // all skills found
  selectedSkills: string[]; // user-selected subset
  diffs: Map<string, ResumeDiff>; // bulletId -> diff
  matchScore: number; // 0-100
  aiStatus: 'idle' | 'analyzing' | 'rewriting' | 'error';
}
```

## 5. AI Integration: Gemini Prompts

### Prompt 1: Skill Extraction
```
System: "You are an expert ATS (Applicant Tracking System) specialist. 
Analyze the provided resume and job description to extract relevant skills, 
tools, frameworks, and methodologies mentioned in the job description."

User Input:
Resume:
[RESUME TEXT]

Job Description:
[JD TEXT]

Task: Return a JSON array of 20-25 key skills/tools that are mentioned in the 
job description and would be valuable for the ATS scoring. Include both hard 
skills (technologies, tools) and soft skills (methodologies, practices). 
Format: ["Skill 1", "Skill 2", ...]
Only return the JSON array, no explanation.
```

### Prompt 2: Bullet Point Rewriting (Context-Aware)
```
System: "You are a professional resume writer specializing in ATS optimization. 
Your task is to rewrite work experience bullet points to emphasize specific skills 
while maintaining authenticity and not hallucinating metrics or achievements."

User Input:
Original Bullet: "[BULLET TEXT]"
Skills to Emphasize: ["Distributed Systems", "Python", "Microservices"]
Resume Context: [FULL RESUME ABOVE]
Job Description: [JD SNIPPET]

Task: Rewrite the bullet point to naturally incorporate the emphasized skills. 
RULES:
1. Never invent metrics, dates, or achievements not implied in the original
2. Keep the same tense and tone as the original
3. Use industry-standard terminology aligned with the JD
4. Highlight where the emphasized skills were applied
5. Keep it to 2-3 lines max

Return ONLY the rewritten bullet as a single line of text, no JSON, no explanation.
```

### Prompt 3: ATS Score Analysis
```
System: "You are an ATS scoring expert."

Input: Resume + Job Description

Task: Analyze how well the resume matches the job description in terms of:
1. Keyword overlap (hard skills)
2. Experience alignment
3. Formatting issues that might cause ATS parsing errors

Return JSON:
{
  "score": <0-100>,
  "matchedSkills": ["skill1", "skill2"],
  "missingSkills": ["skill3"],
  "improvementPotential": <0-100>,
  "recommendations": ["rec1", "rec2"]
}
```

## 6. State Management: Redux/Zustand Store

### Store Shape (Zustand recommended for simplicity)
```typescript
interface ResumeStore {
  // Data
  resume: ResumeState;
  currentJobDescription: string;
  selectedSkills: string[];
  diffs: Map<string, ResumeDiff>;
  matchScore: number;
  
  // Actions
  uploadResume: (file: File) => Promise<void>;
  setJobDescription: (jd: string) => Promise<void>;
  extractSkills: () => Promise<void>;
  toggleSkillSelection: (skill: string) => void;
  rewriteBullets: () => Promise<void>;
  acceptDiff: (bulletId: string) => void;
  rejectDiff: (bulletId: string) => void;
  editDiff: (bulletId: string, newText: string) => void;
  generateFinalPdf: () => Promise<Blob>;
  
  // UI State
  currentStep: 'upload' | 'skills' | 'review' | 'download';
  isLoading: boolean;
  error: string | null;
}
```

## 7. Document Export Strategy

### Option A: HTML + CSS → PDF (Puppeteer)
**Pros:** Perfect formatting preservation, easy CSS control  
**Cons:** Need headless Chrome, more resources

```javascript
// backend/services/pdf-generator.ts
const puppeteer = require('puppeteer');

async function generatePdfFromHtml(htmlContent: string): Promise<Buffer> {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  await page.setContent(htmlContent, { waitUntil: 'networkidle0' });
  const pdf = await page.pdf({ 
    format: 'A4',
    margin: { top: '1cm', right: '1cm', bottom: '1cm', left: '1cm' }
  });
  await browser.close();
  return pdf;
}
```

### Option B: Reconstruct from Original Format + Patches
**Pros:** Lightweight, preserves exact original formatting  
**Cons:** More complex implementation

```javascript
// Reconstruct by replacing specific text in original PDF
function applyChangesToOriginalResume(
  originalPdfBuffer: Buffer,
  changes: Map<string, string> // originalText -> newText
): Promise<Buffer> {
  // Use pdf-lib to modify content streams
  // 1. Load original PDF
  // 2. For each change, find and replace text
  // 3. Output modified PDF
}
```

### Recommended: Hybrid Approach
1. Export as **HTML + embedded CSS** for viewing/editing on frontend
2. Generate **PDF on-demand** using Puppeteer with original styling
3. Cache rendered HTML + styling for performance

## 8. API Endpoints Reference

| Method | Endpoint | Input | Output |
|--------|----------|-------|--------|
| POST | /api/parse-resume | `{ file: File }` | `{ bullets: [], structure: {} }` |
| POST | /api/extract-skills | `{ resume, jobDescription }` | `{ skills: [] }` |
| POST | /api/rewrite-bullets | `{ bullets, skills, resume, jd }` | `{ diffs: [] }` |
| POST | /api/generate-pdf | `{ resume, diffs, acceptedChanges }` | `{ pdf: Blob }` |
| GET | /api/ats-score | `{ resume, jobDescription }` | `{ score, analysis }` |

## 9. Component Architecture

```
App
├── UploadPage
│   ├── DragDropZone
│   └── JobModal
├── SkillSelectionPage
│   ├── SkillPills (interactive)
│   └── DeselectAllButton
├── ReviewPage
│   ├── Analytics Panel (score chart)
│   ├── Resume Preview
│   │   ├── DiffHighlight
│   │   └── DiffTooltip (Accept/Reject/Edit)
│   └── ApplyAllButton
└── DownloadPage
    └── PDFPreview + Download
```

## 10. Error Handling & Edge Cases

| Scenario | Handling |
|----------|----------|
| Invalid PDF | Show user-friendly error; offer text paste option |
| LLM API timeout | Retry logic (exponential backoff); fallback to simpler analysis |
| Large resume (20+ pages) | Chunk bullets into batches; process in parallel |
| No matching skills | Show "Consider expanding your resume" suggestion |
| User edits text → invalid format | Validate before export; show error + recovery option |

## 11. Performance Optimization

1. **Parallel Processing:** Send multiple bullet rewrite requests concurrently
2. **Caching:** Cache extracted skills per (resume hash, jd hash)
3. **Streaming:** Stream large PDF generation progress to UI
4. **Lazy Loading:** Only parse/render visible bullets in review UI
5. **Debouncing:** Debounce user edits before validation

## 12. Security Considerations

- **API Key Storage:** Use environment variables, never commit to repo
- **Rate Limiting:** Limit LLM API calls to prevent abuse
- **File Validation:** Verify uploaded file is actually PDF/DOCX
- **Text Sanitization:** Escape HTML when rendering user edits
- **CORS:** Restrict API access to frontend domain

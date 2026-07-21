# AI-Powered Resume Tailoring Application

A production-ready web application that uses AI (Gemini API) to intelligently tailor resumes for specific job descriptions while maintaining formatting and improving ATS scores.

## 📋 Table of Contents

- [Features](#features)
- [Tech Stack](#tech-stack)
- [Architecture Overview](#architecture-overview)
- [Project Structure](#project-structure)
- [Setup Instructions](#setup-instructions)
- [API Endpoints](#api-endpoints)
- [Core Components](#core-components)
- [State Management](#state-management)
- [LLM Integration](#llm-integration)
- [Deployment](#deployment)
- [Troubleshooting](#troubleshooting)

## ✨ Features

### 1. **Resume Upload & Parsing**
   - Support for PDF, DOCX, and plain text formats
   - Intelligent text extraction with structure preservation
   - Automatic section identification (Work Experience, Skills, Education, etc.)

### 2. **AI-Powered Skill Extraction**
   - Analyzes job description to extract 20-30 relevant skills
   - Categorizes skills (Technical, Soft Skills, Tools, Frameworks, Methodologies)
   - Identifies matched vs. missing skills

### 3. **Interactive Skill Selection**
   - Beautiful, categorized skill selection modal
   - One-click select/deselect all functionality
   - Search and filter skills
   - Real-time skill count display

### 4. **Intelligent Bullet Rewriting**
   - LLM rewrites work experience bullets to emphasize selected skills
   - Prevents hallucination of fake metrics or achievements
   - Maintains original tone and authenticity
   - Shows before/after diffs with green highlighting

### 5. **Interactive Review UI**
   - Split-screen layout with analytics and resume preview
   - Circular progress chart showing ATS match score
   - Inline hover tooltips for each modified bullet
   - Accept/Reject/Edit options for each suggestion
   - Real-time diff updates

### 6. **PDF Export**
   - Generates professional PDF with preserved formatting
   - Applies user-accepted changes
   - Puppeteer-based rendering for accuracy
   - Download as "Tailored-Resume.pdf"

## 🛠 Tech Stack

### Backend
- **Node.js 18+** - Runtime
- **Express.js** - Web framework
- **TypeScript** - Type safety
- **@google/generative-ai** - Gemini API client
- **pdfjs-dist** - PDF parsing
- **mammoth** - DOCX parsing
- **puppeteer** - PDF generation
- **Multer** - File uploads

### Frontend
- **React 18** - UI framework
- **Vite** - Build tool
- **TypeScript** - Type safety
- **Zustand** - State management
- **Framer Motion** - Animations
- **Tailwind CSS** - Styling
- **Axios** - HTTP client
- **Lucide React** - Icons

### APIs
- **Google Gemini API** - LLM for AI tasks

## 🏗 Architecture Overview

```
┌─────────────────────────────────────────┐
│         React Frontend (Vite)           │
│  ┌───────────────────────────────────┐  │
│  │ Pages: Upload→Skills→Review→Dwn  │  │
│  │ State: Zustand Store              │  │
│  │ Components: Modals, Tooltips      │  │
│  └───────────────────────────────────┘  │
└────────────────┬────────────────────────┘
                 │ REST API
┌────────────────▼────────────────────────┐
│      Node.js/Express Backend            │
│  ┌───────────────────────────────────┐  │
│  │ Routes: Parse, Extract, Rewrite  │  │
│  │ Services: AI, PDF, Document      │  │
│  │ Middleware: Auth, CORS, Upload   │  │
│  └───────────────────────────────────┘  │
└────────────────┬────────────────────────┘
                 │
        ┌────────┴────────┐
        ▼                 ▼
    Gemini API      File Storage
    (LLM)           (Temporary)
```

## 📁 Project Structure

```
resume-ai-app/
├── docs/
│   └── ARCHITECTURE.md          # Detailed architecture documentation
├── backend/
│   ├── src/
│   │   ├── services/
│   │   │   ├── gemini.service.ts        # Gemini API integration
│   │   │   ├── document-parser.service.ts # PDF/DOCX parsing
│   │   │   └── pdf-generation.service.ts  # PDF export
│   │   ├── routes/
│   │   │   └── resume.routes.ts        # API endpoints
│   │   ├── types/
│   │   │   └── index.ts                 # TypeScript interfaces
│   │   └── server.ts                    # Express app setup
│   ├── package.json
│   ├── tsconfig.json
│   └── .env.example
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── SkillSelectionModal.tsx   # Skill picker
│   │   │   ├── DiffTooltip.tsx           # Accept/Reject UI\n│   │   │   ├── ResumePreview.tsx        # Resume display\n│   │   │   ├── CircularProgress.tsx     # ATS score chart\n│   │   │   └── ResumeTailorPage.tsx     # Main orchestrator\n│   │   ├── store/\n│   │   │   └── resumeStore.ts           # Zustand state\n│   │   ├── api/\n│   │   │   └── client.ts                # API client\n│   │   ├── App.tsx\n│   │   ├── main.tsx\n│   │   └── index.css\n│   ├── package.json\n│   ├── vite.config.ts\n│   └── index.html\n└── README.md (this file)\n```\n\n## 🚀 Setup Instructions\n\n### Prerequisites\n- Node.js 18+ and npm/yarn\n- Google Gemini API key (get from [Google AI Studio](https://makersuite.google.com/app/apikey))\n\n### Backend Setup\n\n1. **Navigate to backend directory**\n   ```bash\n   cd resume-ai-app/backend\n   ```\n\n2. **Install dependencies**\n   ```bash\n   npm install\n   ```\n\n3. **Set up environment variables**\n   ```bash\n   cp .env.example .env\n   # Edit .env and add your GEMINI_API_KEY\n   ```\n   \n   `.env` should look like:\n   ```\n   GEMINI_API_KEY=your_gemini_api_key_here\n   PORT=5000\n   NODE_ENV=development\n   FRONTEND_URL=http://localhost:5173\n   ```\n\n4. **Start the backend server**\n   ```bash\n   npm run dev\n   ```\n   \n   Server will start at `http://localhost:5000`\n\n### Frontend Setup\n\n1. **Navigate to frontend directory** (in a new terminal)\n   ```bash\n   cd resume-ai-app/frontend\n   ```\n\n2. **Install dependencies**\n   ```bash\n   npm install\n   ```\n\n3. **Create .env file** (optional, for custom API URL)\n   ```bash\n   echo \"VITE_API_URL=http://localhost:5000/api\" > .env.local\n   ```\n\n4. **Start development server**\n   ```bash\n   npm run dev\n   ```\n   \n   Frontend will open at `http://localhost:5173`\n\n## 🔌 API Endpoints\n\nAll endpoints are prefixed with `/api`\n\n### POST /parse-resume\n**Upload and parse a resume file**\n\n```bash\ncurl -X POST http://localhost:5000/api/parse-resume \\\n  -F \"file=@resume.pdf\"\n```\n\nResponse:\n```json\n{\n  \"success\": true,\n  \"data\": {\n    \"rawText\": \"...\",\n    \"bullets\": [...],\n    \"sections\": {...},\n    \"metadata\": {...}\n  }\n}\n```\n\n### POST /extract-skills\n**Extract skills from resume and job description**\n\n```bash\ncurl -X POST http://localhost:5000/api/extract-skills \\\n  -H \"Content-Type: application/json\" \\\n  -d '{\n    \"resume\": \"...\",\n    \"jobDescription\": \"...\"\n  }'\n```\n\nResponse:\n```json\n{\n  \"success\": true,\n  \"data\": {\n    \"allSkills\": [\"Python\", \"AWS\", ...],\n    \"matchedSkills\": [...],\n    \"missingSkills\": [...],\n    \"improvementPotential\": 42\n  }\n}\n```\n\n### POST /rewrite-bullets\n**Rewrite bullets with selected skills**\n\n```bash\ncurl -X POST http://localhost:5000/api/rewrite-bullets \\\n  -H \"Content-Type: application/json\" \\\n  -d '{\n    \"bullets\": [...],\n    \"selectedSkills\": [\"Python\", \"AWS\"],\n    \"resume\": \"...\",\n    \"jobDescription\": \"...\"\n  }'\n```\n\nResponse:\n```json\n{\n  \"success\": true,\n  \"data\": {\n    \"diffs\": [\n      {\n        \"bulletId\": \"...\",\n        \"originalText\": \"...\",\n        \"suggestedText\": \"...\",\n        \"status\": \"pending\",\n        \"skillsHighlighted\": [...]\n      }\n    ]\n  }\n}\n```\n\n### POST /ats-score\n**Calculate ATS match score**\n\n```bash\ncurl -X POST http://localhost:5000/api/ats-score \\\n  -H \"Content-Type: application/json\" \\\n  -d '{\"resume\": \"...\", \"jobDescription\": \"...\"}'\n```\n\nResponse:\n```json\n{\n  \"success\": true,\n  \"data\": {\n    \"score\": 85,\n    \"matchedSkills\": [...],\n    \"missingSkills\": [...],\n    \"improvementPotential\": 12,\n    \"recommendations\": [...]\n  }\n}\n```\n\n### POST /generate-pdf\n**Generate final PDF with accepted changes**\n\n```bash\ncurl -X POST http://localhost:5000/api/generate-pdf \\\n  -H \"Content-Type: application/json\" \\\n  -d '{\n    \"resumeText\": \"...\",\n    \"bullets\": [...],\n    \"diffs\": [...],\n    \"sections\": {...}\n  }' > tailored-resume.pdf\n```\n\n## 🧩 Core Components\n\n### SkillSelectionModal\n**Purpose:** Allow users to select/deselect skills\n\n**Key Features:**\n- Categorized skill display (Technical, Soft Skills, Tools, etc.)\n- Search functionality\n- Select/Deselect All buttons\n- Real-time count display\n\n**Usage:**\n```tsx\n<SkillSelectionModal\n  isOpen={true}\n  skills={allSkills}\n  selectedSkills={selectedSkills}\n  onSkillToggle={(skill) => toggleSkill(skill)}\n  onSelectAll={() => selectAll()}\n  onDeselectAll={() => deselectAll()}\n  onContinue={() => proceedToReview()}\n/>\n```\n\n### DiffTooltip\n**Purpose:** Interactive tooltip for reviewing diff suggestions\n\n**Key Features:**\n- Shows original vs. suggested text\n- Accept/Reject/Edit buttons\n- Manual editing mode\n- Copy to clipboard\n- Status badges (Accepted, Rejected, Edited)\n\n**Usage:**\n```tsx\n<DiffTooltip\n  bulletId=\"bullet_123\"\n  originalText=\"Original text here\"\n  suggestedText=\"Suggested text here\"\n  isVisible={true}\n  position={{ x: 100, y: 200 }}\n  onAccept={() => acceptDiff(\"bullet_123\")}\n  onReject={() => rejectDiff(\"bullet_123\")}\n  onEdit={(newText) => editDiff(\"bullet_123\", newText)}\n  status=\"pending\"\n/>\n```\n\n### ResumePreview\n**Purpose:** Display resume with highlighted diffs\n\n**Key Features:**\n- Color-coded bullet points (green for suggested, yellow for pending)\n- Interactive hover/click to show tooltips\n- Skill highlighting\n- Status indicators\n\n### CircularProgress\n**Purpose:** Display ATS match score as circular chart\n\n**Key Features:**\n- Animated progress circle\n- Color-coded (green ≥80%, amber ≥60%, etc.)\n- Shows improvement potential\n- Responsive sizing\n\n## 📊 State Management\n\nUsing **Zustand** for centralized state:\n\n```typescript\ninterface ResumeStore {\n  // Data\n  rawResumeText: string;\n  jobDescription: string;\n  allSkills: string[];\n  selectedSkills: string[];\n  diffs: Map<string, ResumeDiff>;\n  matchScore: number;\n  \n  // UI\n  currentStep: 'upload' | 'job' | 'skills' | 'review' | 'download';\n  isLoading: boolean;\n  error: string | null;\n  \n  // Actions\n  toggleSkill(skill: string): void;\n  acceptDiff(bulletId: string): void;\n  rejectDiff(bulletId: string): void;\n  editDiff(bulletId: string, newText: string): void;\n  // ... more actions\n}\n```\n\n**Usage in Components:**\n```tsx\nconst store = useResumeStore();\nstore.toggleSkill('Python');\nstore.acceptDiff('bullet_123');\n```\n\n## 🤖 LLM Integration\n\n### Gemini API Service\n\nThree main LLM tasks:\n\n#### 1. Skill Extraction\n```typescript\nawait geminiService.extractSkills(resumeText, jobDescription);\n// Returns: { allSkills, matchedSkills, missingSkills, improvementPotential }\n```\n\n#### 2. Bullet Rewriting\n```typescript\nawait geminiService.rewriteBullet({\n  originalText: \"Developed web applications\",\n  skillsToEmphasize: [\"Python\", \"AWS\"],\n  resumeContext: \"...\",\n  jobDescriptionSnippet: \"...\"\n});\n// Returns: rewritten text string\n```\n\n#### 3. ATS Scoring\n```typescript\nawait geminiService.calculateAtsScore(resumeText, jobDescription);\n// Returns: { score, matchedSkills, missingSkills, recommendations }\n```\n\n### Prompt Engineering\n\nSee [ARCHITECTURE.md](docs/ARCHITECTURE.md) for detailed prompts. Key principles:\n\n- **Specificity:** Clear, actionable instructions\n- **Constraints:** Prevent hallucination of metrics\n- **Format:** Explicit JSON or text format requirements\n- **Context:** Provide full resume context for authenticity\n\n## 📦 Deployment\n\n### Backend Deployment (Heroku Example)\n\n1. **Create Heroku app**\n   ```bash\n   heroku create your-app-name\n   ```\n\n2. **Set environment variables**\n   ```bash\n   heroku config:set GEMINI_API_KEY=your_key\n   heroku config:set NODE_ENV=production\n   ```\n\n3. **Deploy**\n   ```bash\n   git push heroku main\n   ```\n\n### Frontend Deployment (Vercel Example)\n\n1. **Build**\n   ```bash\n   cd frontend\n   npm run build\n   ```\n\n2. **Deploy to Vercel**\n   ```bash\n   npm install -g vercel\n   vercel\n   ```\n\n3. **Set environment variables in Vercel dashboard**\n   - `VITE_API_URL=https://your-backend-url/api`\n\n## 🐛 Troubleshooting\n\n### PDF Parsing Issues\n- **Problem:** \"Could not read this PDF\"\n- **Solution:** Ensure PDF is text-based, not scanned image. Try uploading DOCX instead.\n\n### Gemini API Errors\n- **Problem:** \"GEMINI_API_KEY not found\"\n- **Solution:** Check `.env` file has correct key. Verify key is active in Google Cloud console.\n\n### CORS Errors\n- **Problem:** \"Access to XMLHttpRequest blocked\"\n- **Solution:** Ensure frontend URL in backend `.env` matches actual frontend URL.\n\n### Slow Rewriting\n- **Problem:** Taking >30 seconds to rewrite bullets\n- **Solution:** Gemini API has rate limits. Consider:\n  - Increasing batch size delays in `gemini.service.ts`\n  - Limiting to top 10 most important bullets\n\n## 📝 License\n\nMIT\n\n## 🤝 Contributing\n\nFeel free to open issues and PRs for improvements!\n\n---\n\n**Built with ❤️ using React, Node.js, and Gemini AI**\n
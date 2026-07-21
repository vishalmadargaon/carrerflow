/**
 * Core TypeScript interfaces for the Resume Tailoring application
 */

export interface ResumeBulletPoint {
  /** Unique identifier for this bullet */
  id: string;
  /** The original, immutable text */
  originalText: string;
  /** Parent section name (e.g., "WORK EXPERIENCE", "SKILLS") */
  parentSection: string;
  /** Position index within the parent section */
  sectionIndex: number;
  /** Original formatting metadata */
  formatting: {
    fontSize: number;
    bold: boolean;
    italic: boolean;
    color?: string;
    indent?: number;
  };
}

export interface ResumeDiff {
  /** Bullet ID this diff applies to */
  bulletId: string;
  /** Original text (unchanged) */
  originalText: string;
  /** AI-generated suggestion */
  suggestedText: string;
  /** Current status of this suggestion */
  status: 'pending' | 'accepted' | 'rejected' | 'editing';
  /** User's manual edit, if any */
  userEditedText?: string;
  /** Skills that were highlighted in this rewrite */
  skillsHighlighted: string[];
  /** Indices of where skills appear in the suggested text */
  highlightedIndices: Array<{
    skill: string;
    start: number;
    end: number;
  }>;
}

export interface ParsedResume {
  /** Raw extracted text from PDF/DOCX */
  rawText: string;
  /** Structured bullet points with metadata */
  bullets: ResumeBulletPoint[];
  /** Detected sections and their content */
  sections: Map<string, string[]>;
  /** Metadata about the original document */
  metadata: {
    format: 'pdf' | 'docx' | 'text';
    pageCount?: number;
    extractedAt: Date;
  };
}

export interface SkillExtractionResult {
  /** All extracted skills from the job description */
  allSkills: string[];
  /** Skills that match the resume */
  matchedSkills: string[];
  /** Skills missing from the resume */
  missingSkills: string[];
  /** Estimated improvement potential (0-100) */
  improvementPotential: number;
}

export interface RewriteRequest {
  /** The original bullet text */
  originalText: string;
  /** Skills to emphasize */
  skillsToEmphasize: string[];
  /** Full resume context for reference */
  resumeContext: string;
  /** Relevant excerpt from job description */
  jobDescriptionSnippet: string;
}

export interface AtsScoreResult {
  /** Overall ATS match score (0-100) */
  score: number;
  /** Skills found in both resume and JD */
  matchedSkills: string[];
  /** Skills in JD but not in resume */
  missingSkills: string[];
  /** Estimated improvement potential */
  improvementPotential: number;
  /** AI-generated recommendations */
  recommendations: string[];
}

export interface ResumeState {
  /** Raw resume text */
  rawText: string;
  /** Parsed resume structure */
  parsed?: ParsedResume;
  /** Job description text */
  jobDescription: string;
  /** Extracted skills */
  extractedSkills: string[];
  /** User-selected subset of skills */
  selectedSkills: string[];
  /** Diff objects per bullet */
  diffs: Map<string, ResumeDiff>;
  /** Overall match score */
  matchScore: number;
  /** Current processing status */
  status: 'idle' | 'parsing' | 'analyzing' | 'rewriting' | 'error';
  /** Error message if status is 'error' */
  error?: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  timestamp: Date;
}

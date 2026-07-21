/**
 * Zustand State Management Store
 * Central state for the entire application
 */

import { create } from 'zustand';

export interface ResumeBulletPoint {
  id: string;
  originalText: string;
  parentSection: string;
  sectionIndex: number;
  formatting: {
    fontSize: number;
    bold: boolean;
    italic: boolean;
    color?: string;
    indent?: number;
  };
}

export interface ResumeDiff {
  bulletId: string;
  originalText: string;
  suggestedText: string;
  status: 'pending' | 'accepted' | 'rejected' | 'editing';
  userEditedText?: string;
  skillsHighlighted: string[];
  highlightedIndices: Array<{
    skill: string;
    start: number;
    end: number;
  }>;
}

export interface ParsedResume {
  rawText: string;
  bullets: ResumeBulletPoint[];
  sections: Record<string, string[]>;
  metadata: {
    format: 'pdf' | 'docx' | 'text';
    pageCount?: number;
    extractedAt: string;
  };
}

export interface ResumeStore {
  // Data State
  rawResumeText: string;
  parsedResume: ParsedResume | null;
  jobDescription: string;
  allSkills: string[];
  selectedSkills: string[];
  diffs: Map<string, ResumeDiff>;
  matchScore: number;
  matchedSkills: string[];
  missingSkills: string[];
  improvementPotential: number;

  // UI State
  currentStep: 'upload' | 'job' | 'skills' | 'review' | 'download';
  isLoading: boolean;
  loadingMessage: string;
  error: string | null;
  successMessage: string | null;

  // Actions
  setRawResumeText: (text: string) => void;
  setParsedResume: (resume: ParsedResume | null) => void;
  setJobDescription: (jd: string) => void;
  setAllSkills: (skills: string[]) => void;
  toggleSkill: (skill: string) => void;
  selectAllSkills: () => void;
  deselectAllSkills: () => void;
  setDiffs: (diffs: ResumeDiff[]) => void;
  acceptDiff: (bulletId: string) => void;
  rejectDiff: (bulletId: string) => void;
  editDiff: (bulletId: string, newText: string) => void;
  setMatchScore: (score: number) => void;
  setMatchedSkills: (skills: string[]) => void;
  setMissingSkills: (skills: string[]) => void;
  setImprovementPotential: (potential: number) => void;

  // UI Actions
  setCurrentStep: (step: ResumeStore['currentStep']) => void;
  setIsLoading: (loading: boolean, message?: string) => void;
  setError: (error: string | null) => void;
  setSuccessMessage: (message: string | null) => void;

  // Reset
  resetState: () => void;
}

const initialState = {
  rawResumeText: '',
  parsedResume: null,
  jobDescription: '',
  allSkills: [],
  selectedSkills: [],
  diffs: new Map(),
  matchScore: 0,
  matchedSkills: [],
  missingSkills: [],
  improvementPotential: 0,
  currentStep: 'upload' as const,
  isLoading: false,
  loadingMessage: '',
  error: null,
  successMessage: null,
};

export const useResumeStore = create<ResumeStore>((set) => ({
  ...initialState,

  setRawResumeText: (text) => set({ rawResumeText: text }),
  setParsedResume: (resume) => set({ parsedResume: resume }),
  setJobDescription: (jd) => set({ jobDescription: jd }),

  setAllSkills: (skills) => set({ allSkills: skills }),

  toggleSkill: (skill) =>
    set((state) => ({
      selectedSkills: state.selectedSkills.includes(skill)
        ? state.selectedSkills.filter((s) => s !== skill)
        : [...state.selectedSkills, skill],
    })),

  selectAllSkills: () =>
    set((state) => ({
      selectedSkills: [...state.allSkills],
    })),

  deselectAllSkills: () =>
    set({
      selectedSkills: [],
    }),

  setDiffs: (newDiffs) =>
    set((state) => {
      const diffsMap = new Map(state.diffs);
      newDiffs.forEach((diff) => {
        diffsMap.set(diff.bulletId, diff);
      });
      return { diffs: diffsMap };
    }),

  acceptDiff: (bulletId) =>
    set((state) => {
      const diffsMap = new Map(state.diffs);
      const diff = diffsMap.get(bulletId);
      if (diff) {
        diff.status = 'accepted';
        diffsMap.set(bulletId, diff);
      }
      return { diffs: diffsMap };
    }),

  rejectDiff: (bulletId) =>
    set((state) => {
      const diffsMap = new Map(state.diffs);
      const diff = diffsMap.get(bulletId);
      if (diff) {
        diff.status = 'rejected';
        diffsMap.set(bulletId, diff);
      }
      return { diffs: diffsMap };
    }),

  editDiff: (bulletId, newText) =>
    set((state) => {
      const diffsMap = new Map(state.diffs);
      const diff = diffsMap.get(bulletId);
      if (diff) {
        diff.status = 'editing';
        diff.userEditedText = newText;
        diffsMap.set(bulletId, diff);
      }
      return { diffs: diffsMap };
    }),

  setMatchScore: (score) => set({ matchScore: score }),
  setMatchedSkills: (skills) => set({ matchedSkills: skills }),
  setMissingSkills: (skills) => set({ missingSkills: skills }),
  setImprovementPotential: (potential) =>
    set({ improvementPotential: potential }),

  setCurrentStep: (step) => set({ currentStep: step }),
  setIsLoading: (loading, message) =>
    set({ isLoading: loading, loadingMessage: message || '' }),
  setError: (error) => set({ error }),
  setSuccessMessage: (message) => set({ successMessage: message }),

  resetState: () => set(initialState),
}));

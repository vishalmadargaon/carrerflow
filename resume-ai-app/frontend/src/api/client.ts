/**
 * API Client
 * Handles all HTTP requests to the backend
 */

import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export interface ParseResumeResponse {
  success: boolean;
  data?: {
    rawText: string;
    bullets: any[];
    sections: Record<string, string[]>;
    metadata: any;
  };
  error?: string;
}

export interface ExtractSkillsResponse {
  success: boolean;
  data?: {
    allSkills: string[];
    matchedSkills: string[];
    missingSkills: string[];
    improvementPotential: number;
  };
  error?: string;
}

export interface RewriteBulletsResponse {
  success: boolean;
  data?: {
    diffs: any[];
  };
  error?: string;
}

export interface AtsScoreResponse {
  success: boolean;
  data?: {
    score: number;
    matchedSkills: string[];
    missingSkills: string[];
    improvementPotential: number;
    recommendations: string[];
  };
  error?: string;
}

export const resumeApi = {
  /**
   * Upload and parse a resume file
   */
  async parseResume(file: File): Promise<ParseResumeResponse> {
    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await apiClient.post('/parse-resume', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return response.data;
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.error || error.message,
      };
    }
  },

  /**
   * Extract skills from resume and job description
   */
  async extractSkills(
    resume: string,
    jobDescription: string
  ): Promise<ExtractSkillsResponse> {
    try {
      const response = await apiClient.post('/extract-skills', {
        resume,
        jobDescription,
      });
      return response.data;
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.error || error.message,
      };
    }
  },

  /**
   * Rewrite bullets with selected skills emphasis
   */
  async rewriteBullets(
    bullets: any[],
    selectedSkills: string[],
    resume: string,
    jobDescription: string
  ): Promise<RewriteBulletsResponse> {
    try {
      const response = await apiClient.post('/rewrite-bullets', {
        bullets,
        selectedSkills,
        resume,
        jobDescription,
      });
      return response.data;
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.error || error.message,
      };
    }
  },

  /**
   * Calculate ATS score
   */
  async calculateAtsScore(
    resume: string,
    jobDescription: string
  ): Promise<AtsScoreResponse> {
    try {
      const response = await apiClient.post('/ats-score', {
        resume,
        jobDescription,
      });
      return response.data;
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.error || error.message,
      };
    }
  },

  /**
   * Generate final PDF
   */
  async generatePdf(
    resumeText: string,
    bullets: any[],
    diffs: any[],
    sections: Record<string, string[]>
  ): Promise<Blob> {
    try {
      const response = await apiClient.post(
        '/generate-pdf',
        {
          resumeText,
          bullets,
          diffs,
          sections,
        },
        {
          responseType: 'blob',
        }
      );
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.error || error.message);
    }
  },
};

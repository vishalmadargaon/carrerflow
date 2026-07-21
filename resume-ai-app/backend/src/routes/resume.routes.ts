/**
 * API Routes for Resume Tailoring Application
 * Handles all incoming requests for resume processing and AI tasks
 */

import express, { Router, Request, Response, NextFunction } from 'express';
import multer from 'multer';
import * as fs from 'fs';
import * as path from 'path';
import { geminiService } from '../services/gemini.service.js';
import { documentParserService } from '../services/document-parser.service.js';
import { pdfGenerationService } from '../services/pdf-generation.service.js';
import {
  ApiResponse,
  ResumeBulletPoint,
  ResumeDiff,
  ParsedResume,
} from '../types/index.js';

const router = Router();

// Configure multer for file uploads
const uploadDir = path.join(process.cwd(), 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const upload = multer({
  storage: multer.diskStorage({
    destination: uploadDir,
    filename: (req, file, cb) => {
      const filename = `${Date.now()}-${file.originalname}`;
      cb(null, filename);
    },
  }),
  fileFilter: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    if (['.pdf', '.docx', '.txt'].includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error('Only PDF, DOCX, and TXT files are allowed'));
    }
  },
});

// Error handling middleware for async routes
const asyncHandler = (
  fn: (req: Request, res: Response, next: NextFunction) => Promise<void>
) => (req: Request, res: Response, next: NextFunction) => {
  return Promise.resolve(fn(req, res, next)).catch(next);
};

/**
 * POST /api/parse-resume
 * Upload and parse a resume file
 */
router.post(
  '/parse-resume',
  upload.single('file'),
  asyncHandler(async (req: Request, res: Response) => {
    if (!req.file) {
      return res
        .status(400)
        .json({
          success: false,
          error: 'No file uploaded',
          timestamp: new Date(),
        } as ApiResponse<any>);
    }

    try {
      const parsed = await documentParserService.parseResumeFile(req.file.path);

      // Clean up uploaded file
      fs.unlinkSync(req.file.path);

      const response: ApiResponse<ParsedResume> = {
        success: true,
        data: parsed,
        timestamp: new Date(),
      };

      res.json(response);
    } catch (error: any) {
      fs.unlinkSync(req.file.path);
      res.status(400).json({
        success: false,
        error: error.message || 'Failed to parse resume',
        timestamp: new Date(),
      } as ApiResponse<any>);
    }
  })
);

/**
 * POST /api/extract-skills
 * Extract skills from resume and job description
 */
router.post(
  '/extract-skills',
  asyncHandler(async (req: Request, res: Response) => {
    const { resume, jobDescription } = req.body;

    if (!resume || !jobDescription) {
      return res.status(400).json({
        success: false,
        error: 'Resume and job description are required',
        timestamp: new Date(),
      } as ApiResponse<any>);
    }

    try {
      const result = await geminiService.extractSkills(resume, jobDescription);

      const response: ApiResponse<typeof result> = {
        success: true,
        data: result,
        timestamp: new Date(),
      };

      res.json(response);
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to extract skills',
        timestamp: new Date(),
      } as ApiResponse<any>);
    }
  })
);

/**
 * POST /api/rewrite-bullets
 * Rewrite work experience bullets to emphasize selected skills
 */
router.post(
  '/rewrite-bullets',
  asyncHandler(async (req: Request, res: Response) => {
    const { bullets, selectedSkills, resume, jobDescription } = req.body;

    if (!Array.isArray(bullets) || !selectedSkills || !resume) {
      return res.status(400).json({
        success: false,
        error: 'Invalid request parameters',
        timestamp: new Date(),
      } as ApiResponse<any>);
    }

    try {
      const diffs: ResumeDiff[] = [];

      // Filter to only rewritable bullets
      const rewritable =
        documentParserService.getRewritableBullets(bullets);

      // Process bullets in parallel but with rate limiting
      const batchSize = 3;
      for (let i = 0; i < rewritable.length; i += batchSize) {
        const batch = rewritable.slice(i, i + batchSize);

        const batchPromises = batch.map(async (bullet) => {
          try {
            const rewritten = await geminiService.rewriteBullet({
              originalText: bullet.originalText,
              skillsToEmphasize: selectedSkills,
              resumeContext: resume,
              jobDescriptionSnippet: jobDescription.slice(0, 500),
            });

            const highlights = geminiService.getSkillHighlights(
              rewritten,
              selectedSkills
            );

            const diff: ResumeDiff = {
              bulletId: bullet.id,
              originalText: bullet.originalText,
              suggestedText: rewritten,
              status: 'pending',
              skillsHighlighted: selectedSkills.filter((s: string) =>
                rewritten.toLowerCase().includes(s.toLowerCase())
              ),
              highlightedIndices: highlights,
            };

            return diff;
          } catch (error: any) {
            console.error(`Failed to rewrite bullet ${bullet.id}:`, error);
            return null;
          }
        });

        const batchResults = await Promise.all(batchPromises);
        diffs.push(...batchResults.filter((d) => d !== null));

        // Rate limiting: wait between batches
        if (i + batchSize < rewritable.length) {
          await new Promise((resolve) => setTimeout(resolve, 1000));
        }
      }

      const response: ApiResponse<{ diffs: ResumeDiff[] }> = {
        success: true,
        data: { diffs },
        timestamp: new Date(),
      };

      res.json(response);
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to rewrite bullets',
        timestamp: new Date(),
      } as ApiResponse<any>);
    }
  })
);

/**
 * POST /api/ats-score
 * Calculate ATS score for resume and job description
 */
router.post(
  '/ats-score',
  asyncHandler(async (req: Request, res: Response) => {
    const { resume, jobDescription } = req.body;

    if (!resume || !jobDescription) {
      return res.status(400).json({
        success: false,
        error: 'Resume and job description are required',
        timestamp: new Date(),
      } as ApiResponse<any>);
    }

    try {
      const result = await geminiService.calculateAtsScore(
        resume,
        jobDescription
      );

      const response: ApiResponse<typeof result> = {
        success: true,
        data: result,
        timestamp: new Date(),
      };

      res.json(response);
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to calculate ATS score',
        timestamp: new Date(),
      } as ApiResponse<any>);
    }
  })
);

/**
 * POST /api/generate-pdf
 * Generate final PDF with accepted changes
 */
router.post(
  '/generate-pdf',
  asyncHandler(async (req: Request, res: Response) => {
    const { resumeText, bullets, diffs, sections } = req.body;

    if (!resumeText) {
      return res.status(400).json({
        success: false,
        error: 'Resume text is required',
        timestamp: new Date(),
      } as ApiResponse<any>);
    }

    try {
      // Convert diffs array to Map
      const diffsMap = new Map<string, ResumeDiff>();
      if (Array.isArray(diffs)) {
        diffs.forEach((diff: ResumeDiff) => {
          diffsMap.set(diff.bulletId, diff);
        });
      }

      // Convert sections object to Map if needed
      const sectionsMap =
        sections instanceof Map
          ? sections
          : new Map(Object.entries(sections || {}));

      // Generate PDF with changes
      const pdfBuffer = await pdfGenerationService.generatePdfWithChanges(
        bullets || [],
        diffsMap,
        sectionsMap,
        'Tailored-Resume.pdf'
      );

      // Set response headers for PDF download
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader(
        'Content-Disposition',
        'attachment; filename=Tailored-Resume.pdf'
      );
      res.send(pdfBuffer);
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to generate PDF',
        timestamp: new Date(),
      } as ApiResponse<any>);
    }
  })
);

/**
 * Health check endpoint
 */
router.get(
  '/health',
  asyncHandler(async (req: Request, res: Response) => {
    const response: ApiResponse<{ status: string }> = {
      success: true,
      data: { status: 'API is running' },
      timestamp: new Date(),
    };
    res.json(response);
  })
);

export default router;

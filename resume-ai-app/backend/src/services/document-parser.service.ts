/**
 * Document Parser Service
 * Handles PDF and DOCX extraction, text parsing, and structure identification
 */

import * as fs from 'fs';
import * as path from 'path';
import { PDFDocument } from 'pdfjs-dist';
import * as mammoth from 'mammoth';
import { ParsedResume, ResumeBulletPoint } from '../types/index.js';

class DocumentParserService {
  /**
   * Main entry point: Parse uploaded file (PDF, DOCX, or text)
   * Returns structured resume data
   */
  async parseResumeFile(filePath: string): Promise<ParsedResume> {
    const ext = path.extname(filePath).toLowerCase();

    let rawText = '';

    if (ext === '.pdf') {
      rawText = await this.extractTextFromPdf(filePath);
    } else if (ext === '.docx') {
      rawText = await this.extractTextFromDocx(filePath);
    } else if (ext === '.txt') {
      rawText = fs.readFileSync(filePath, 'utf-8');
    } else {
      throw new Error(`Unsupported file format: ${ext}`);
    }

    // Parse the extracted text into structured resume
    return this.parseResumeText(rawText, ext as 'pdf' | 'docx' | 'txt');
  }

  /**
   * Extract text from PDF file
   * Uses pdf.js for robust PDF parsing
   */
  private async extractTextFromPdf(filePath: string): Promise<string> {
    try {
      // Note: pdfjs-dist requires proper setup with worker
      // For production, consider using pdf2txt or similar CLI tool
      // or ensure worker file is properly configured

      const data = new Uint8Array(fs.readFileSync(filePath));
      const doc = await PDFDocument.getDocument(data).promise;
      let fullText = '';

      for (let i = 1; i <= doc.numPages; i++) {
        const page = await doc.getPage(i);
        const textContent = await page.getTextContent();

        // Extract text items, preserving line breaks
        const pageText = textContent.items
          .map((item: any) => item.str)
          .join(' ');

        fullText += pageText + '\n';
      }

      return fullText;
    } catch (error) {
      console.error('Error parsing PDF:', error);
      throw new Error('Failed to parse PDF file. Try uploading a text-based PDF.');
    }
  }

  /**
   * Extract text from DOCX file
   * Uses mammoth library for robust Word document parsing
   */
  private async extractTextFromDocx(filePath: string): Promise<string> {
    try {
      const buffer = fs.readFileSync(filePath);
      const result = await mammoth.extractRawText({ buffer });
      return result.value;
    } catch (error) {
      console.error('Error parsing DOCX:', error);
      throw new Error('Failed to parse DOCX file.');
    }
  }

  /**
   * Parse resume text into structured format
   * Identifies sections and bullet points
   */
  private parseResumeText(
    text: string,
    format: 'pdf' | 'docx' | 'txt'
  ): ParsedResume {
    // Common resume section headers
    const sectionHeaders = [
      'PROFESSIONAL SUMMARY',
      'OBJECTIVE',
      'RELEVANT SKILLS',
      'TECHNICAL SKILLS',
      'CORE SKILLS',
      'WORK EXPERIENCE',
      'PROFESSIONAL EXPERIENCE',
      'EXPERIENCE',
      'KEY PROJECTS',
      'PROJECTS',
      'EDUCATION',
      'CERTIFICATIONS',
      'AWARDS',
      'PUBLICATIONS',
      'VOLUNTEERING',
      'LANGUAGES',
    ];

    const bullets: ResumeBulletPoint[] = [];
    const sections = new Map<string, string[]>();

    const lines = text.split('\n').map((line) => line.trim());
    let currentSection = '';
    let bulletIndex = 0;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];

      if (!line) continue;

      // Check if this line is a section header
      const isSectionHeader = sectionHeaders.some(
        (header) =>
          line.toUpperCase().includes(header) ||
          header.includes(line.toUpperCase())
      );

      if (isSectionHeader) {
        currentSection = line.toUpperCase();
        sections.set(currentSection, []);
        bulletIndex = 0;
      } else if (currentSection) {
        // This is content within a section
        sections.get(currentSection)?.push(line);

        // Identify bullet points (lines starting with -, •, *, etc.)
        if (/^[-•*]/.test(line)) {
          const cleanedText = line.replace(/^[-•*]\s*/, '').trim();
          const bulletId = `bullet_${Date.now()}_${Math.random()}`;

          bullets.push({
            id: bulletId,
            originalText: cleanedText,
            parentSection: currentSection,
            sectionIndex: bulletIndex,
            formatting: {
              fontSize: 11,
              bold: false,
              italic: false,
            },
          });

          bulletIndex++;
        }
      }
    }

    return {
      rawText: text,
      bullets,
      sections,
      metadata: {
        format,
        extractedAt: new Date(),
      },
    };
  }

  /**
   * Identify section type from text
   * Useful for determining which sections should be rewritten
   */
  getSectionType(sectionName: string): 'workExperience' | 'skills' | 'other' {
    const workExp = [
      'WORK EXPERIENCE',
      'PROFESSIONAL EXPERIENCE',
      'EXPERIENCE',
      'EMPLOYMENT',
    ];
    const skills = [
      'TECHNICAL SKILLS',
      'RELEVANT SKILLS',
      'CORE SKILLS',
      'SKILLS',
    ];

    if (workExp.some((s) => sectionName.includes(s))) {
      return 'workExperience';
    }
    if (skills.some((s) => sectionName.includes(s))) {
      return 'skills';
    }
    return 'other';
  }

  /**
   * Filter bullets to only those worth rewriting
   * Skip bullets that are too short or not in work experience section
   */
  getRewritableBullets(bullets: ResumeBulletPoint[]): ResumeBulletPoint[] {
    return bullets.filter((bullet) => {
      // Only rewrite work experience bullets
      if (
        !bullet.parentSection.includes('EXPERIENCE') &&
        !bullet.parentSection.includes('PROJECT')
      ) {
        return false;
      }

      // Skip very short bullets (< 20 characters)
      if (bullet.originalText.length < 20) {
        return false;
      }

      // Skip bullets that look like dates or company names
      if (/^\d{4}|^[A-Z]+\s*[\(\)]/.test(bullet.originalText)) {
        return false;
      }

      return true;
    });
  }
}

// Export singleton instance
export const documentParserService = new DocumentParserService();

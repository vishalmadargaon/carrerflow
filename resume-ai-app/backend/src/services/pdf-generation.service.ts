/**
 * PDF Generation Service
 * Handles converting resume data to final PDF with formatting preserved
 */

import * as puppeteer from 'puppeteer';
import { ResumeBulletPoint, ResumeDiff } from '../types/index.js';

class PdfGenerationService {
  /**
   * Generate PDF from resume text with proper formatting
   * Uses Puppeteer (headless Chrome) for accurate rendering
   */
  async generatePdfFromResume(
    resumeText: string,
    title: string = 'Resume'
  ): Promise<Buffer> {
    const browser = await puppeteer.launch({
      headless: 'new',
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });

    try {
      const page = await browser.newPage();

      // Create HTML with professional resume styling
      const html = this.createResumeHtml(resumeText);

      await page.setContent(html, {
        waitUntil: 'networkidle0',
      });

      // Generate PDF with professional settings
      const pdf = await page.pdf({
        format: 'A4',
        margin: {
          top: '0.5in',
          right: '0.5in',
          bottom: '0.5in',
          left: '0.5in',
        },
        printBackground: true,
      });

      return pdf as Buffer;
    } finally {
      await browser.close();
    }
  }

  /**
   * Generate PDF from bullets with diffs applied
   * Applies user-accepted changes to the resume
   */
  async generatePdfWithChanges(
    originalBullets: ResumeBulletPoint[],
    diffs: Map<string, ResumeDiff>,
    sections: Map<string, string[]>,
    title: string = 'Resume'
  ): Promise<Buffer> {
    // Reconstruct resume text with accepted changes
    const reconstructed = this.reconstructResumeWithChanges(
      originalBullets,
      diffs,
      sections
    );

    // Generate PDF from reconstructed resume
    return this.generatePdfFromResume(reconstructed, title);
  }

  /**
   * Create professional HTML for resume rendering
   * Includes CSS for proper formatting
   */
  private createResumeHtml(resumeText: string): string {
    const css = `
      * {
        margin: 0;
        padding: 0;
        box-sizing: border-box;
      }
      body {
        font-family: 'Calibri', 'Arial', sans-serif;
        font-size: 11pt;
        line-height: 1.4;
        color: #333;
        background: white;
        padding: 20px;
      }
      .resume-container {
        max-width: 8.5in;
        margin: 0 auto;
        background: white;
      }
      .resume-name {
        font-size: 16pt;
        font-weight: bold;
        margin-bottom: 5px;
        text-align: center;
        letter-spacing: 1px;
      }
      .resume-contact {
        font-size: 9pt;
        text-align: center;
        margin-bottom: 10px;
        color: #666;
      }
      .resume-section {
        font-size: 12pt;
        font-weight: bold;
        margin-top: 12px;
        margin-bottom: 6px;
        border-bottom: 1px solid #000;
        padding-bottom: 2px;
        text-transform: uppercase;
      }
      .resume-role {
        font-weight: bold;
        margin-top: 8px;
        margin-bottom: 2px;
      }
      .resume-bullet {
        margin-left: 20px;
        text-indent: -10px;
        margin-bottom: 4px;
        page-break-inside: avoid;
      }
      .resume-bullet:before {
        content: "•";
        margin-right: 8px;
      }
      .resume-paragraph {
        margin-bottom: 6px;
        text-align: justify;
      }
      .skill-tag {
        background-color: #e8f4f8;
        padding: 0 2px;
        border-radius: 2px;
      }
      @media print {
        body {
          padding: 0;
        }
        .resume-container {
          box-shadow: none;
        }
      }
    `;

    const escapedText = this.escapeHtml(resumeText);
    const formattedContent = this.formatResumeText(resumeText);

    return `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Resume</title>
        <style>${css}</style>
      </head>
      <body>
        <div class="resume-container">
          ${formattedContent}
        </div>
      </body>
      </html>
    `;
  }

  /**
   * Format resume text with HTML structure
   * Applies semantic HTML tags based on content patterns
   */
  private formatResumeText(text: string): string {
    const lines = text.split('\n').map((line) => line.trim());
    const sectionHeaders = [
      'PROFESSIONAL SUMMARY',
      'OBJECTIVE',
      'RELEVANT SKILLS',
      'TECHNICAL SKILLS',
      'WORK EXPERIENCE',
      'EXPERIENCE',
      'KEY PROJECTS',
      'PROJECTS',
      'EDUCATION',
      'CERTIFICATIONS',
      'AWARDS',
      'PUBLICATIONS',
    ];

    let html = '';
    let nameFound = false;

    for (const line of lines) {
      if (!line) {
        continue;
      }

      // First non-empty line is likely the name
      if (!nameFound && line.length < 60 && !sectionHeaders.some((s) =>
        line.toUpperCase().includes(s)
      )) {
        html += `<div class="resume-name">${this.escapeHtml(line)}</div>`;
        nameFound = true;
        continue;
      }

      // Check for section headers
      if (sectionHeaders.some((header) =>
        line.toUpperCase().includes(header)
      )) {
        html += `<div class="resume-section">${this.escapeHtml(line)}</div>`;
        continue;
      }

      // Check for bullet points
      if (/^[-•*]/.test(line)) {
        const cleanedText = line.replace(/^[-•*]\s*/, '').trim();
        html += `<div class="resume-bullet">${this.escapeHtml(cleanedText)}</div>`;
        continue;
      }

      // Check for job titles / roles (usually all caps or mixed case on separate line)
      if (line.length < 100 && /^[A-Z].*[A-Z]$|engineer|developer|designer|analyst|manager/i.test(line)) {
        html += `<div class="resume-role">${this.escapeHtml(line)}</div>`;
        continue;
      }

      // Everything else is a paragraph
      if (line.length > 0) {
        html += `<div class="resume-paragraph">${this.escapeHtml(line)}</div>`;
      }
    }

    return html;
  }

  /**
   * Reconstruct resume with user-accepted changes applied
   */
  private reconstructResumeWithChanges(
    originalBullets: ResumeBulletPoint[],
    diffs: Map<string, ResumeDiff>,
    sections: Map<string, string[]>
  ): string {
    let result = '';

    for (const [sectionName, content] of sections) {
      result += `${sectionName}\n`;

      for (const line of content) {
        // Check if this line corresponds to a bullet with a diff
        const bulletWithDiff = Array.from(diffs.values()).find(
          (diff) =>
            diff.originalText === line && diff.status === 'accepted'
        );

        if (bulletWithDiff) {
          // Use the accepted change or user edit
          const finalText =
            bulletWithDiff.userEditedText || bulletWithDiff.suggestedText;
          result += `• ${finalText}\n`;
        } else {
          // Keep original line
          result += `${line}\n`;
        }
      }

      result += '\n';
    }

    return result;
  }

  /**
   * Escape HTML special characters to prevent injection
   */
  private escapeHtml(text: string): string {
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }
}

// Export singleton instance
export const pdfGenerationService = new PdfGenerationService();

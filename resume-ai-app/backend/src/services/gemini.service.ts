/**
 * Gemini AI Service
 * Handles all LLM interactions: skill extraction, bullet rewriting, ATS scoring
 */

import { GoogleGenerativeAI } from '@google/generative-ai';
import {
  SkillExtractionResult,
  RewriteRequest,
  AtsScoreResult,
} from '../types/index.js';

class GeminiService {
  private client: GoogleGenerativeAI;
  private model = 'gemini-pro'; // Using the latest available model

  constructor() {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error('GEMINI_API_KEY environment variable is not set');
    }
    this.client = new GoogleGenerativeAI(apiKey);
  }

  /**
   * PROMPT 1: Extract key skills from job description vs resume
   * Returns 20-25 skills relevant to ATS scoring
   */
  async extractSkills(
    resumeText: string,
    jobDescription: string
  ): Promise<SkillExtractionResult> {
    try {
      const prompt = `You are an expert ATS (Applicant Tracking System) specialist and recruiter.

Your task: Analyze the provided resume and job description to extract relevant skills, tools, frameworks, methodologies, and certifications.

RESUME:
${resumeText}

JOB DESCRIPTION:
${jobDescription}

TASK:
1. Extract 20-30 key skills/tools mentioned in the job description
2. Classify them as: matched (found in resume) vs missing (not in resume)
3. Estimate improvement potential if candidate incorporates missing skills

Return ONLY valid JSON (no markdown, no explanation):
{
  "allSkills": ["Skill1", "Skill2", ...],
  "matchedSkills": ["MatchedSkill1", ...],
  "missingSkills": ["MissingSkill1", ...],
  "improvementPotential": 75
}`;

      const model = this.client.getGenerativeModel({ model: this.model });
      const result = await model.generateContent(prompt);
      const responseText = result.response.text();

      // Extract JSON from response (handle markdown code blocks)
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No valid JSON in response');
      }

      const parsed = JSON.parse(jsonMatch[0]);
      return {
        allSkills: parsed.allSkills || [],
        matchedSkills: parsed.matchedSkills || [],
        missingSkills: parsed.missingSkills || [],
        improvementPotential: parsed.improvementPotential || 0,
      };
    } catch (error) {
      console.error('Error extracting skills:', error);
      throw error;
    }
  }

  /**
   * PROMPT 2: Rewrite a work experience bullet point to emphasize selected skills
   * Ensures authenticity and prevents hallucination of metrics
   */
  async rewriteBullet(request: RewriteRequest): Promise<string> {
    try {
      const prompt = `You are a professional resume writer specializing in ATS optimization and skill emphasis.

Your task: Rewrite a work experience bullet point to naturally emphasize specific skills while maintaining complete authenticity.

ORIGINAL BULLET:
"${request.originalText}"

SKILLS TO EMPHASIZE:
${request.skillsToEmphasize.map((s) => `- ${s}`).join('\n')}

RESUME CONTEXT (for authenticity verification):
${request.resumeContext}

RELEVANT JOB DESCRIPTION CONTEXT:
${request.jobDescriptionSnippet}

CRITICAL RULES:
1. NEVER invent metrics, percentages, dates, or achievements not implied in the original
2. Keep the same tense and tone as the original bullet
3. Use industry-standard terminology aligned with the job description
4. Naturally weave in the emphasized skills without forcing them
5. Keep rewritten bullet to 2-3 lines maximum
6. Maintain the verb-first action format (e.g., "Built", "Developed", "Led")

RETURN: Only the rewritten bullet as plain text (single paragraph). NO JSON, NO EXPLANATION, NO QUOTES.`;

      const model = this.client.getGenerativeModel({ model: this.model });
      const result = await model.generateContent(prompt);
      const rewrittenText = result.response.text().trim();

      // Remove any surrounding quotes if present
      return rewrittenText.replace(/^["']|["']$/g, '');
    } catch (error) {
      console.error('Error rewriting bullet:', error);
      throw error;
    }
  }

  /**
   * PROMPT 3: Calculate ATS score and provide improvement recommendations
   */
  async calculateAtsScore(
    resumeText: string,
    jobDescription: string
  ): Promise<AtsScoreResult> {
    try {
      const prompt = `You are an ATS scoring expert with deep knowledge of how applicant tracking systems evaluate resumes.

RESUME:
${resumeText}

JOB DESCRIPTION:
${jobDescription}

TASK:
Analyze how well this resume aligns with the job description across these dimensions:
1. Keyword overlap (technical skills, tools, frameworks)
2. Experience level alignment (years of experience, seniority level)
3. Industry terminology usage
4. ATS parsing compatibility (formatting issues that might cause parsing errors)

Calculate:
- Overall ATS match score (0-100)
- Matched skills (found in both)
- Missing skills (critical gaps)
- Improvement potential if resume is optimized

Return ONLY valid JSON:
{
  "score": 75,
  "matchedSkills": ["Python", "AWS"],
  "missingSkills": ["Kubernetes", "Docker"],
  "improvementPotential": 20,
  "recommendations": ["Recommendation 1", "Recommendation 2"]
}`;

      const model = this.client.getGenerativeModel({ model: this.model });
      const result = await model.generateContent(prompt);
      const responseText = result.response.text();

      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No valid JSON in response');
      }

      const parsed = JSON.parse(jsonMatch[0]);
      return {
        score: parsed.score || 0,
        matchedSkills: parsed.matchedSkills || [],
        missingSkills: parsed.missingSkills || [],
        improvementPotential: parsed.improvementPotential || 0,
        recommendations: parsed.recommendations || [],
      };
    } catch (error) {
      console.error('Error calculating ATS score:', error);
      throw error;
    }
  }

  /**
   * UTILITY: Identify which skills to highlight in a rewritten bullet
   * Returns indices of where each skill appears in the text
   */
  getSkillHighlights(
    text: string,
    skills: string[]
  ): Array<{
    skill: string;
    start: number;
    end: number;
  }> {
    const highlights: Array<{ skill: string; start: number; end: number }> = [];
    const lowerText = text.toLowerCase();

    for (const skill of skills) {
      const lowerSkill = skill.toLowerCase();
      let index = 0;

      while ((index = lowerText.indexOf(lowerSkill, index)) !== -1) {
        highlights.push({
          skill,
          start: index,
          end: index + skill.length,
        });
        index += skill.length;
      }
    }

    return highlights.sort((a, b) => a.start - b.start);
  }
}

// Export singleton instance
export const geminiService = new GeminiService();

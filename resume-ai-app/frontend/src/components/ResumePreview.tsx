/**
 * ResumePreview Component with Diff Highlighting
 * Displays resume with diff highlights and interactive tooltips
 */

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { DiffTooltip } from './DiffTooltip';
import { ResumeDiff } from '../store/resumeStore';

interface ResumePreviewProps {
  resumeText: string;
  diffs: Map<string, ResumeDiff>;
  onAcceptDiff: (bulletId: string) => void;
  onRejectDiff: (bulletId: string) => void;
  onEditDiff: (bulletId: string, newText: string) => void;
}

interface TooltipState {
  visible: boolean;
  bulletId: string;
  x: number;
  y: number;
}

export const ResumePreview: React.FC<ResumePreviewProps> = ({
  resumeText,
  diffs,
  onAcceptDiff,
  onRejectDiff,
  onEditDiff,
}) => {
  const [tooltipState, setTooltipState] = useState<TooltipState>({
    visible: false,
    bulletId: '',
    x: 0,
    y: 0,
  });

  const lines = resumeText.split('\n').map((line) => line.trim());
  const sections = [
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
  ];

  const handleBulletClick = (
    e: React.MouseEvent,
    bulletId: string,
    bulletText: string
  ) => {
    const diff = diffs.get(bulletId);
    if (diff) {
      const rect = (e.target as HTMLElement).getBoundingClientRect();
      setTooltipState({
        visible: true,
        bulletId,
        x: rect.left,
        y: rect.top - 10,
      });
    }
  };

  const renderLine = (line: string, index: number) => {
    if (!line) return null;

    // Find if this line matches any diff
    let matchingDiff: ResumeDiff | null = null;
    let bulletId = '';

    diffs.forEach((diff, id) => {
      if (diff.originalText === line) {
        matchingDiff = diff;
        bulletId = id;
      }
    });

    // Check if it's a section header
    const isSection = sections.some((section) =>
      line.toUpperCase().includes(section)
    );

    // Check if it's a bullet point
    const isBullet = /^[-•*]/.test(line);

    if (isSection) {
      return (
        <div key={`line-${index}`} className="text-lg font-bold mt-4 mb-2 text-gray-900 border-b-2 border-gray-300 pb-1 uppercase tracking-wide">
          {line}
        </div>
      );
    }

    if (matchingDiff && isBullet) {
      const cleanedText = line.replace(/^[-•*]\s*/, '').trim();
      const statusColor =
        matchingDiff.status === 'accepted'
          ? 'bg-green-50'
          : matchingDiff.status === 'rejected'
          ? 'bg-red-50'
          : matchingDiff.status === 'editing'
          ? 'bg-blue-50'
          : 'bg-yellow-50';

      return (
        <motion.div
          key={`line-${index}`}
          className={`ml-4 my-2 p-3 rounded cursor-pointer border-l-4 ${statusColor} ${
            matchingDiff.status === 'accepted'
              ? 'border-green-500'
              : matchingDiff.status === 'rejected'
              ? 'border-red-500'
              : matchingDiff.status === 'editing'
              ? 'border-blue-500'
              : 'border-yellow-500'
          } hover:shadow-md transition-shadow`}
          onClick={(e) => handleBulletClick(e, bulletId, cleanedText)}
          whileHover={{ scale: 1.01 }}
        >
          <div className="flex items-start gap-2">
            <span className="text-gray-400 mt-1">•</span>
            <div className="flex-1">
              {/* Original text with strikethrough */}
              <p className="text-sm text-gray-500 line-through mb-1">
                {matchingDiff.originalText}
              </p>
              {/* Suggested text in green */}
              <p className="text-sm text-gray-900 font-medium">
                {matchingDiff.userEditedText ||
                  matchingDiff.suggestedText}
              </p>
              {/* Skills highlighted */}
              {matchingDiff.skillsHighlighted.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-2">
                  {matchingDiff.skillsHighlighted.map((skill) => (
                    <span
                      key={skill}
                      className="inline-block px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded font-semibold"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              )}
              {/* Status indicator */}
              <div className="mt-2 text-xs text-gray-600">
                {matchingDiff.status === 'pending' && (
                  <span className="text-yellow-600 font-semibold">
                    Click to review
                  </span>
                )}
                {matchingDiff.status === 'accepted' && (
                  <span className="text-green-600 font-semibold">
                    ✓ Accepted
                  </span>
                )}
                {matchingDiff.status === 'rejected' && (
                  <span className="text-red-600 font-semibold">
                    ✕ Rejected
                  </span>
                )}
                {matchingDiff.status === 'editing' && (
                  <span className="text-blue-600 font-semibold">
                    ◉ Edited
                  </span>
                )}
              </div>
            </div>
          </div>
        </motion.div>
      );
    }

    // Regular bullet without diff
    if (isBullet) {
      const cleanedText = line.replace(/^[-•*]\s*/, '').trim();
      return (
        <div
          key={`line-${index}`}
          className="ml-4 my-2 flex items-start gap-2 text-sm text-gray-700"
        >
          <span className="text-gray-400 mt-1">•</span>
          <span>{cleanedText}</span>
        </div>
      );
    }

    // Check if it's a role/position line
    if (
      line.length < 150 &&
      /^[A-Z].*[A-Z]$|engineer|developer|designer|analyst|manager/i.test(line)
    ) {
      return (
        <div
          key={`line-${index}`}
          className="font-semibold text-gray-900 mt-3 mb-1"
        >
          {line}
        </div>
      );
    }

    // Regular paragraph
    return (
      <div key={`line-${index}`} className="text-sm text-gray-700 my-1">
        {line}
      </div>
    );
  };

  const currentDiff = diffs.get(tooltipState.bulletId);

  return (
    <>
      <div className="bg-white p-8 rounded-lg border border-gray-300 shadow-lg font-serif">
        <div className="prose prose-sm max-w-none">
          {lines.map((line, index) => renderLine(line, index))}
        </div>
      </div>

      {/* Tooltip */}
      {currentDiff && (
        <DiffTooltip
          bulletId={tooltipState.bulletId}
          originalText={currentDiff.originalText}
          suggestedText={currentDiff.suggestedText}
          isVisible={tooltipState.visible}
          position={{ x: tooltipState.x, y: tooltipState.y }}
          onAccept={() => {
            onAcceptDiff(tooltipState.bulletId);
            setTooltipState({ ...tooltipState, visible: false });
          }}\n          onReject={() => {\n            onRejectDiff(tooltipState.bulletId);\n            setTooltipState({ ...tooltipState, visible: false });\n          }}\n          onEdit={(newText) => {\n            onEditDiff(tooltipState.bulletId, newText);\n          }}\n          status={currentDiff.status}\n          userEditedText={currentDiff.userEditedText}\n        />\n      )}\n\n      {/* Close tooltip when clicking outside */}\n      {tooltipState.visible && (\n        <div\n          className=\"fixed inset-0 z-40\"\n          onClick={() =>\n            setTooltipState({ ...tooltipState, visible: false })\n          }\n        />\n      )}\n    </>\n  );\n};\n
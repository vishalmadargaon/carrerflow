/**
 * DiffTooltip Component
 * Interactive tooltip for resume bullet diffs
 * Shows Accept/Reject/Edit options for each modified bullet
 */

import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, X, Edit2, Copy } from 'lucide-react';

interface DiffTooltipProps {
  bulletId: string;
  originalText: string;
  suggestedText: string;
  isVisible: boolean;
  position: { x: number; y: number };
  onAccept: () => void;
  onReject: () => void;
  onEdit: (newText: string) => void;
  status: 'pending' | 'accepted' | 'rejected' | 'editing';
  userEditedText?: string;
}

export const DiffTooltip: React.FC<DiffTooltipProps> = ({
  bulletId,
  originalText,
  suggestedText,
  isVisible,
  position,
  onAccept,
  onReject,
  onEdit,
  status,
  userEditedText,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editedText, setEditedText] = useState(userEditedText || suggestedText);
  const tooltipRef = useRef<HTMLDivElement>(null);

  // Auto-adjust position if tooltip goes off-screen
  const [adjustedPosition, setAdjustedPosition] = useState(position);

  useEffect(() => {
    if (tooltipRef.current && isVisible) {
      const rect = tooltipRef.current.getBoundingClientRect();
      let x = position.x;
      let y = position.y;

      // Adjust X if off-screen
      if (rect.right > window.innerWidth) {
        x = Math.max(0, position.x - rect.width);
      }

      // Adjust Y if off-screen
      if (rect.bottom > window.innerHeight) {
        y = Math.max(0, position.y - rect.height - 20);
      }

      setAdjustedPosition({ x, y });
    }
  }, [isVisible, position]);

  const handleSave = () => {
    onEdit(editedText);
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditedText(userEditedText || suggestedText);
    setIsEditing(false);
  };

  if (!isVisible) return null;

  return (
    <AnimatePresence>
      <motion.div
        ref={tooltipRef}
        initial={{ opacity: 0, scale: 0.9, y: -10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: -10 }}
        transition={{ duration: 0.2 }}
        style={{
          position: 'fixed',
          left: `${adjustedPosition.x}px`,
          top: `${adjustedPosition.y}px`,
          zIndex: 1000,
        }}
        className="bg-white rounded-lg shadow-2xl border border-gray-200 max-w-sm"
      >
        <div className="p-4">
          {/* Status Badge */}
          {status !== 'pending' && (
            <div className="mb-3 flex items-center gap-2">
              {status === 'accepted' && (
                <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-700 text-xs font-semibold rounded">
                  <Check size={14} /> Accepted
                </span>
              )}
              {status === 'rejected' && (
                <span className="inline-flex items-center gap-1 px-2 py-1 bg-red-100 text-red-700 text-xs font-semibold rounded">
                  <X size={14} /> Rejected
                </span>
              )}
              {status === 'editing' && (
                <span className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-700 text-xs font-semibold rounded">
                  <Edit2 size={14} /> Edited
                </span>
              )}
            </div>
          )}

          {/* Content */}
          {isEditing ? (
            /* Edit Mode */
            <div className="space-y-3">
              <label className="block">
                <span className="text-xs font-semibold text-gray-700 mb-2 block">
                  Edit the suggested text:
                </span>
                <textarea
                  value={editedText}
                  onChange={(e) => setEditedText(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={3}
                />
              </label>
              <div className="flex gap-2">
                <button
                  onClick={handleSave}
                  className="flex-1 px-3 py-2 bg-blue-600 text-white text-sm font-semibold rounded hover:bg-blue-700 transition-colors flex items-center justify-center gap-1"
                >
                  <Check size={16} /> Save
                </button>
                <button
                  onClick={handleCancel}
                  className="flex-1 px-3 py-2 bg-gray-200 text-gray-700 text-sm font-semibold rounded hover:bg-gray-300 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            /* View Mode */
            <div className="space-y-3">
              {/* Original Text */}
              <div>
                <p className="text-xs font-semibold text-gray-600 mb-1">
                  Original:
                </p>
                <p className="text-sm text-gray-600 line-through">
                  {originalText}
                </p>
              </div>

              {/* Suggested Text */}
              <div>
                <p className="text-xs font-semibold text-gray-600 mb-1">
                  Suggested:
                </p>
                <p className="text-sm text-green-700 font-medium bg-green-50 p-2 rounded">
                  {editedText}
                </p>
              </div>

              {/* Action Buttons */}
              {status === 'pending' && (
                <div className="flex gap-2 pt-2">
                  <button
                    onClick={onAccept}
                    className="flex-1 px-3 py-2 bg-green-600 text-white text-sm font-semibold rounded hover:bg-green-700 transition-colors flex items-center justify-center gap-1"
                    title="Accept this suggestion"
                  >
                    <Check size={16} /> Accept
                  </button>
                  <button
                    onClick={() => setIsEditing(true)}
                    className="flex-1 px-3 py-2 bg-blue-100 text-blue-700 text-sm font-semibold rounded hover:bg-blue-200 transition-colors flex items-center justify-center gap-1"
                    title="Edit before accepting"
                  >
                    <Edit2 size={16} /> Edit
                  </button>
                  <button
                    onClick={onReject}
                    className="flex-1 px-3 py-2 bg-red-100 text-red-700 text-sm font-semibold rounded hover:bg-red-200 transition-colors flex items-center justify-center gap-1"
                    title="Reject this suggestion"
                  >
                    <X size={16} /> Reject
                  </button>
                </div>
              )}

              {status === 'accepted' && (
                <button
                  onClick={() => setIsEditing(true)}
                  className="w-full px-3 py-2 bg-blue-100 text-blue-700 text-sm font-semibold rounded hover:bg-blue-200 transition-colors flex items-center justify-center gap-1"
                >
                  <Edit2 size={16} /> Edit Again
                </button>
              )}

              {status === 'rejected' && (
                <button
                  onClick={onAccept}
                  className="w-full px-3 py-2 bg-green-100 text-green-700 text-sm font-semibold rounded hover:bg-green-200 transition-colors flex items-center justify-center gap-1"
                >
                  <Check size={16} /> Accept After All
                </button>
              )}

              {status === 'editing' && (
                <button
                  onClick={() => setIsEditing(true)}
                  className="w-full px-3 py-2 bg-blue-600 text-white text-sm font-semibold rounded hover:bg-blue-700 transition-colors flex items-center justify-center gap-1"
                >
                  <Edit2 size={16} /> Edit Again
                </button>
              )}

              {/* Copy Button */}
              <button
                onClick={() => {
                  navigator.clipboard.writeText(editedText);
                  alert('Copied to clipboard!');
                }}
                className="w-full px-3 py-1 text-xs text-gray-600 hover:bg-gray-100 rounded transition-colors flex items-center justify-center gap-1"
              >
                <Copy size={14} /> Copy to Clipboard
              </button>
            </div>
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

/**
 * SkillSelectionModal Component
 * Displays extracted skills as interactive pills
 * Users can select/deselect skills they want to emphasize
 */

import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ChevronDown, ChevronUp } from 'lucide-react';

interface SkillSelectionModalProps {
  isOpen: boolean;
  skills: string[];
  selectedSkills: string[];
  onSkillToggle: (skill: string) => void;
  onSelectAll: () => void;
  onDeselectAll: () => void;
  onContinue: () => void;
  isLoading?: boolean;
}

export const SkillSelectionModal: React.FC<SkillSelectionModalProps> = ({
  isOpen,
  skills,
  selectedSkills,
  onSkillToggle,
  onSelectAll,
  onDeselectAll,
  onContinue,
  isLoading = false,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(
    new Set(['Technical', 'Soft Skills', 'Tools'])
  );

  // Categorize skills
  const categorizedSkills = useMemo(() => {
    const categories: Record<string, string[]> = {
      'Technical': [],
      'Soft Skills': [],
      'Tools': [],
      'Frameworks': [],
      'Methodologies': [],
    };

    skills.forEach((skill) => {
      const lower = skill.toLowerCase();

      if (
        lower.includes('python') ||
        lower.includes('java') ||
        lower.includes('javascript') ||
        lower.includes('typescript') ||
        lower.includes('sql') ||
        lower.includes('algorithm')
      ) {
        categories['Technical'].push(skill);
      } else if (
        lower.includes('communication') ||
        lower.includes('leadership') ||
        lower.includes('teamwork') ||
        lower.includes('management') ||
        lower.includes('problem')
      ) {
        categories['Soft Skills'].push(skill);
      } else if (
        lower.includes('react') ||
        lower.includes('angular') ||
        lower.includes('vue') ||
        lower.includes('node') ||
        lower.includes('spring')
      ) {
        categories['Frameworks'].push(skill);
      } else if (
        lower.includes('docker') ||
        lower.includes('kubernetes') ||
        lower.includes('aws') ||
        lower.includes('azure') ||
        lower.includes('git')
      ) {
        categories['Tools'].push(skill);
      } else if (
        lower.includes('agile') ||
        lower.includes('scrum') ||
        lower.includes('kanban')
      ) {
        categories['Methodologies'].push(skill);
      } else {
        categories['Technical'].push(skill);
      }
    });

    // Filter by search term
    if (searchTerm) {
      const filtered: Record<string, string[]> = {};
      Object.entries(categories).forEach(([cat, items]) => {
        filtered[cat] = items.filter((skill) =>
          skill.toLowerCase().includes(searchTerm.toLowerCase())
        );
      });
      return filtered;
    }

    return categories;
  }, [skills, searchTerm]);

  const filteredSkills = Object.values(categorizedSkills).flat();
  const selectedCount = selectedSkills.length;
  const totalCount = skills.length;

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] flex flex-col shadow-2xl"
        >
          {/* Header */}
          <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
            <div>
              <h2 className="text-xl font-bold text-gray-900">
                Select key skills to focus on
              </h2>
              <p className="text-sm text-gray-600 mt-1">
                The optimizer will incorporate all the selected skills onto your resume.
                Please de-select the ones that are not relevant.
              </p>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-sm font-semibold text-blue-600">
                {selectedCount}/{totalCount}
              </span>
            </div>
          </div>

          {/* Search & Controls */}
          <div className="px-6 py-3 border-b border-gray-200 flex gap-2">
            <input
              type="text"
              placeholder="Search skills..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              onClick={onSelectAll}
              className="px-3 py-2 text-sm font-medium text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
            >
              Select All
            </button>
            <button
              onClick={onDeselectAll}
              className="px-3 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-md transition-colors"
            >
              Deselect All
            </button>
          </div>

          {/* Skills Grid */}
          <div className="flex-1 overflow-y-auto px-6 py-4">
            {Object.entries(categorizedSkills).map(
              ([category, categorySkills]) => {
                if (categorySkills.length === 0) return null;

                const isExpanded = expandedCategories.has(category);

                return (
                  <div key={category} className="mb-4">
                    <button
                      onClick={() => {
                        const newSet = new Set(expandedCategories);
                        if (isExpanded) {
                          newSet.delete(category);
                        } else {
                          newSet.add(category);
                        }
                        setExpandedCategories(newSet);
                      }}
                      className="flex items-center gap-2 w-full text-left mb-2 font-semibold text-gray-700 hover:text-gray-900"
                    >
                      {isExpanded ? (
                        <ChevronUp size={18} />
                      ) : (
                        <ChevronDown size={18} />
                      )}
                      <span>{category}</span>
                      <span className="ml-auto text-xs text-gray-500">
                        {categorySkills.length}
                      </span>
                    </button>

                    {isExpanded && (
                      <div className="flex flex-wrap gap-2 mb-3">
                        {categorySkills.map((skill) => {
                          const isSelected = selectedSkills.includes(skill);
                          return (
                            <motion.button
                              key={skill}
                              onClick={() => onSkillToggle(skill)}
                              layout
                              initial={{ opacity: 0, scale: 0.8 }}
                              animate={{ opacity: 1, scale: 1 }}
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                              className={`px-3 py-2 rounded-full text-sm font-medium transition-all whitespace-nowrap ${
                                isSelected
                                  ? 'bg-blue-600 text-white shadow-md'
                                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                              }`}
                            >
                              {isSelected && <span className="mr-1">✓</span>}
                              {skill}
                            </motion.button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              }
            )}

            {filteredSkills.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                No skills match your search
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="px-6 py-4 border-t border-gray-200 flex justify-end gap-2 bg-gray-50">
            <button
              disabled={isLoading}
              onClick={onContinue}
              className="px-6 py-2 bg-blue-600 text-white font-semibold rounded-md hover:bg-blue-700 disabled:bg-gray-400 transition-colors flex items-center gap-2"
            >
              {isLoading ? (
                <>
                  <span className="animate-spin">⏳</span>
                  Processing...
                </>
              ) : (
                <>
                  Continue
                  <span>→</span>
                </>
              )}
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

import React from 'react';
import { cn } from '@/lib/utils';
import { ChevronDown, ChevronUp, Edit2, Save, X } from 'lucide-react';

interface PreferenceCardProps {
  title: string;
  description?: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
  isExpanded?: boolean;
  onToggle?: () => void;
  isEditing?: boolean;
  onEdit?: () => void;
  onSave?: () => void;
  onCancel?: () => void;
  className?: string;
}

const PreferenceCard: React.FC<PreferenceCardProps> = ({
  title,
  description,
  icon,
  children,
  isExpanded = true,
  onToggle,
  isEditing = false,
  onEdit,
  onSave,
  onCancel,
  className
}) => {
  return (
    <div className={cn(
      "bg-white rounded-xl shadow-sm border hover:shadow-md transition-all duration-300",
      className
    )}>
      {/* Header */}
      <div className="p-6 border-b">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            {icon && (
              <div className="p-2 bg-blue-50 rounded-lg">
                {icon}
              </div>
            )}
            <div>
              <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
              {description && (
                <p className="text-sm text-gray-600 mt-1">{description}</p>
              )}
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            {isEditing ? (
              <>
                <button
                  onClick={onSave}
                  className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                >
                  <Save className="w-4 h-4" />
                </button>
                <button
                  onClick={onCancel}
                  className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </>
            ) : (
              onEdit && (
                <button
                  onClick={onEdit}
                  className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
              )
            )}
            
            {onToggle && (
              <button
                onClick={onToggle}
                className="p-2 text-gray-400 hover:text-gray-600 rounded-lg transition-colors"
              >
                {isExpanded ? (
                  <ChevronUp className="w-4 h-4" />
                ) : (
                  <ChevronDown className="w-4 h-4" />
                )}
              </button>
            )}
          </div>
        </div>
      </div>
      
      {/* Content */}
      {isExpanded && (
        <div className="p-6">
          {children}
        </div>
      )}
    </div>
  );
};

export default PreferenceCard;
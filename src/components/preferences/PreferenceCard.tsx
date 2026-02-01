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
  className,
}) => {
  return (
    <div
      className={cn(
        'rounded-xl border bg-white shadow-sm transition-all duration-300 hover:shadow-md',
        className
      )}
    >
      {/* Header */}
      <div className="border-b p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            {icon && <div className="rounded-lg bg-blue-50 p-2">{icon}</div>}
            <div>
              <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
              {description && <p className="mt-1 text-sm text-gray-600">{description}</p>}
            </div>
          </div>

          <div className="flex items-center space-x-2">
            {isEditing ? (
              <>
                <button
                  onClick={onSave}
                  className="rounded-lg p-2 text-green-600 transition-colors hover:bg-green-50"
                >
                  <Save className="h-4 w-4" />
                </button>
                <button
                  onClick={onCancel}
                  className="rounded-lg p-2 text-red-600 transition-colors hover:bg-red-50"
                >
                  <X className="h-4 w-4" />
                </button>
              </>
            ) : (
              onEdit && (
                <button
                  onClick={onEdit}
                  className="rounded-lg p-2 text-blue-600 transition-colors hover:bg-blue-50"
                >
                  <Edit2 className="h-4 w-4" />
                </button>
              )
            )}

            {onToggle && (
              <button
                onClick={onToggle}
                className="rounded-lg p-2 text-gray-400 transition-colors hover:text-gray-600"
              >
                {isExpanded ? (
                  <ChevronUp className="h-4 w-4" />
                ) : (
                  <ChevronDown className="h-4 w-4" />
                )}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Content */}
      {isExpanded && <div className="p-6">{children}</div>}
    </div>
  );
};

export default PreferenceCard;

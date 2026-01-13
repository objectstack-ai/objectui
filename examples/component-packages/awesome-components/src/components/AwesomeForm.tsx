import React from 'react';

export interface AwesomeFormProps {
  /** ObjectQL object name */
  object: string;
  /** Record ID for editing */
  recordId?: string;
  /** Form mode */
  mode?: 'create' | 'edit' | 'view';
  /** Submit handler */
  onSubmit?: (values: any) => void;
}

/**
 * AwesomeForm - Flexible form builder component
 */
export const AwesomeForm: React.FC<AwesomeFormProps> = ({
  object,
  recordId,
  mode = 'create',
  onSubmit
}) => {
  return (
    <div className="awesome-form bg-white rounded-lg shadow p-6">
      <h3 className="text-lg font-semibold mb-4">
        Awesome Form: {mode} {object}
      </h3>
      <div className="text-gray-600">
        Form component for {recordId || 'new record'}
      </div>
    </div>
  );
};

export default AwesomeForm;

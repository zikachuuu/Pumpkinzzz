import React, { useState } from 'react';
import { formatDate, getDateInputValue } from '../../utils/date';

export default function FormattedDateInput({ value, onChange, dateFormat, required, className }) {
  const [isEditing, setIsEditing] = useState(false);

  if (isEditing) {
    return (
      <input
        type="date"
        value={getDateInputValue(value, dateFormat)}
        required={required}
        autoFocus
        onChange={onChange}
        onBlur={() => setIsEditing(false)}
        className={className}
      />
    );
  }

  return (
    <div
      tabIndex={0}
      onClick={() => setIsEditing(true)}
      onFocus={() => setIsEditing(true)}
      className={`${className} cursor-text flex items-center bg-white`}
    >
      <span className={!value ? 'text-gray-400' : 'text-gray-900'}>
        {value ? formatDate(value, dateFormat) : (dateFormat || 'Select date...')}
      </span>
    </div>
  );
}
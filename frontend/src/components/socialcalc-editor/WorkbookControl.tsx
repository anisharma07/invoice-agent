import React from 'react';

interface WorkbookControlProps {
  id?: string;
  className?: string;
  style?: React.CSSProperties;
}

/**
 * Container div for the SocialCalc workbook controls (sheet tabs).
 * This component provides the DOM mounting point for the sheet tab bar.
 * SocialCalc will fully control the DOM within this container.
 */
export const WorkbookControl: React.FC<WorkbookControlProps> = ({
  id = 'workbookControl',
  className,
  style,
}) => {
  return (
    <div
      id={id}
      className={className}
      style={{
        backgroundColor: 'transparent',
        minHeight: '0px',
        ...style,
      }}
    >
      {/* SocialCalc will render workbook sheet tabs here */}
    </div>
  );
};

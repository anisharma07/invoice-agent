import React from 'react';

interface SpreadsheetEditorProps {
  id?: string;
  className?: string;
  style?: React.CSSProperties;
}

/**
 * Container div for the SocialCalc table editor.
 * This component provides the DOM mounting point for SocialCalc.
 * SocialCalc will fully control the DOM within this container.
 */
export const SpreadsheetEditor: React.FC<SpreadsheetEditorProps> = ({
  id = 'tableeditor',
  className,
  style,
}) => {
  return (
    <div style={{ margin: '8px 0px 10px 0px', ...style }}>
      <div
        id={id}
        className={className}
        style={{
          margin: '8px 0px 10px 0px',
        }}
      >
        {/* SocialCalc will render the spreadsheet editor here */}
      </div>
    </div>
  );
};

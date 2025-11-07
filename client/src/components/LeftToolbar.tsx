import React from 'react';

const LeftToolbar = () => {
  return (
    <aside className="left-toolbar">
      <button type="button" aria-label="Add scenario">+</button>
      <button type="button" aria-label="Remove scenario">–</button>
      <button type="button" aria-label="Reset layout">Reset</button>
    </aside>
  );
};

export default LeftToolbar;

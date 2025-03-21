import React, { useState } from 'react';
import LinkForm from './LinkForm';
import './SidebarMenu.css';

function SidebarMenu({
  isOpen,
  onClose,
  onAddLink,
  toggleTheme,
  toggleRemoveMode,
  currentTheme
}) {
  const [showForm, setShowForm] = useState(false);

  const isDarkChecked = currentTheme === 'dark';

  const handleThemeSwitch = () => {
    toggleTheme();
  };

  const handleAddBlockClick = () => {
    setShowForm((prev) => !prev);
  };

  return (
    <div className={`sidebar-menu ${isOpen ? 'open' : ''}`}>
      <h2>Меню</h2>

      <button onClick={handleAddBlockClick}>Добавить блок</button>
      {showForm && (
        <div className="add-form-wrapper">
          <LinkForm onAddLink={onAddLink} />
        </div>
      )}

      <button onClick={toggleRemoveMode}>Изменение блока</button>

      <label className="switch theme-switch">
        <input
          type="checkbox"
          checked={isDarkChecked}
          onChange={handleThemeSwitch}
        />
        <span className="slider" />
      </label>
    </div>
  );
}

export default SidebarMenu;

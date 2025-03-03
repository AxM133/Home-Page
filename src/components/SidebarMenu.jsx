import React, { useState, useEffect } from 'react';
import LinkForm from './LinkForm';
import './SidebarMenu.css';

function SidebarMenu({
  isOpen,
  onClose,
  onAddLink,
  toggleTheme,
  toggleRemoveMode
}) {
  const [showForm, setShowForm] = useState(false);
  const [isDarkChecked, setIsDarkChecked] = useState(false);

  useEffect(() => {
    // Считываем сохранённое состояние "isDark" из localStorage
    const storedIsDark = localStorage.getItem('isDark');
    if (storedIsDark === 'true') {
      setIsDarkChecked(true);
    } else {
      setIsDarkChecked(false);
    }
  }, []);

  // При изменении переключателя
  const handleThemeSwitch = (e) => {
    const checked = e.target.checked;
    setIsDarkChecked(checked);
    localStorage.setItem('isDark', checked ? 'true' : 'false');
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

      {/* Переключатель темы (switch) внизу */}
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

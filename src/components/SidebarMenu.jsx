import React, { useState, useEffect } from 'react';
import LinkForm from './LinkForm';
import './SidebarMenu.css';

function SidebarMenu({
  isOpen,
  onClose,
  onAddLink,
  toggleTheme,      // функция из родителя, переключающая саму тему
  toggleRemoveMode,
  sortBy,
  setSortBy,
  selectedCategory,
  setSelectedCategory,
  allCategories
}) {
  const [showForm, setShowForm] = useState(false);
  const [isDarkChecked, setIsDarkChecked] = useState(false);

  useEffect(() => {
    // Считываем сохранённое состояние "isDark" из localStorage
    const storedIsDark = localStorage.getItem('isDark');
    // если в localStorage нет, оставим false
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

    // Сохраняем в localStorage
    localStorage.setItem('isDark', checked ? 'true' : 'false');

    // Вызываем родительский toggleTheme, 
    // который действительно переключает тему (dark <-> light)
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

      <h4>Сортировка</h4>
      <select value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
        <option value="manual">Ручная (Drag & Drop)</option>
        <option value="alphabetical">По алфавиту</option>
        <option value="date">По дате (новые сверху)</option>
      </select>

      <h4>Категория</h4>
      <select
        value={selectedCategory}
        onChange={(e) => setSelectedCategory(e.target.value)}
      >
        {allCategories.map((cat) => (
          <option key={cat} value={cat}>
            {cat}
          </option>
        ))}
      </select>

      {/* Переключатель темы (switch) внизу справа, 
          но теперь он сохраняет чек и при перезапуске страницы */}
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
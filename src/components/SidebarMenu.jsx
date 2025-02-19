import React, { useState } from 'react';
import LinkForm from './LinkForm';
import './SidebarMenu.css';

function SidebarMenu({
  isOpen,
  onClose,
  onAddLink,
  toggleTheme,
  toggleRemoveMode,
  sortBy,
  setSortBy,
  selectedCategory,
  setSelectedCategory,
  allCategories
}) {
  const [showForm, setShowForm] = useState(false);

  const handleAddBlockClick = () => {
    setShowForm((prev) => !prev);
  };

  return (
    <div className={`sidebar-menu ${isOpen ? 'open' : ''}`}>

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

      {/* Переключатель темы (switch) в самом нижнем правом углу */}
      <label className="switch theme-switch">
        <input onClick={toggleTheme} type="checkbox" />
        <span className="slider" />
      </label>
    </div>
  );
}

export default SidebarMenu;

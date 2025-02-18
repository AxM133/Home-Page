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
      <button className="close-button" onClick={onClose}>
        &times;
      </button>
      <h2>Меню</h2>

      <button onClick={handleAddBlockClick}>Добавить блок</button>
      {showForm && (
        <div className="add-form-wrapper">
          <LinkForm onAddLink={onAddLink} />
        </div>
      )}

      <button onClick={toggleTheme}>Смена темы</button>
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
    </div>
  );
}

export default SidebarMenu;

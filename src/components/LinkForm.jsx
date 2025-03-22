import React, { useState, useRef } from 'react';
import { FiInfo } from 'react-icons/fi';
import './LinkForm.css';

function LinkForm({ onAddLink, availableCategories = ['video'] }) {
  const [title, setTitle] = useState('');
  const [url, setUrl] = useState('');
  const [iconBase64, setIconBase64] = useState('');
  const [category, setCategory] = useState('');
  const [showCatDropdown, setShowCatDropdown] = useState(false);

  const dropdownRef = useRef(null);

  const isValidUrl = (value) => {
    try {
      new URL(value);
      return true;
    } catch {
      return false;
    }
  };

  const fetchWithTimeout = (checkUrl, options, timeout = 3000) => {
    return Promise.race([
      fetch(checkUrl, options),
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error('timeout')), timeout)
      ),
    ]);
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) {
      setIconBase64('');
      return;
    }
    const reader = new FileReader();
    reader.onload = (evt) => {
      const base64Data = evt.target.result;
      setIconBase64(base64Data);
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (title.trim() === '' || url.trim() === '') return;
    if (!isValidUrl(url)) {
      alert('Пожалуйста, введите корректный URL, например, https://example.com');
      return;
    }
    try {
      await fetchWithTimeout(url, { method: 'HEAD', mode: 'no-cors' }, 3000);
      onAddLink({
        title,
        url,
        customIcon: iconBase64 || '',
        category: category.trim(),
        createdAt: Date.now(),
      });
      setTitle('');
      setUrl('');
      setIconBase64('');
      setCategory('');
      e.target.reset();
    } catch {
      alert('Сайт не найден или недоступен');
    }
  };

  // Список всех категорий: всегда "favorite" первой, плюс те, которые есть у пользователя (например, "video")
  const allCats = Array.from(new Set(['favorite', ...availableCategories]));

  // Фильтрация по введённому тексту
  const filteredCats = category
    ? allCats.filter((c) =>
        c.toLowerCase().startsWith(category.toLowerCase())
      )
    : allCats;

  const handleCategoryChange = (e) => {
    setCategory(e.target.value);
    setShowCatDropdown(true);
  };

  const handleCategoryFocus = () => {
    setShowCatDropdown(true);
  };

  const handleCategoryBlur = () => {
    setTimeout(() => {
      setShowCatDropdown(false);
    }, 150);
  };

  const handleCategoryKeyDown = (e) => {
    if (e.key === 'Enter' && filteredCats.length > 0) {
      setCategory(filteredCats[0]);
      setShowCatDropdown(false);
      e.preventDefault();
    }
  };

  const selectCategory = (catItem) => {
    setCategory(catItem);
    setShowCatDropdown(false);
  };

  return (
    <form onSubmit={handleSubmit} className="link-form">
      <div className="input-group">
        <label>
          Название ссылки
          <span className="tooltip-icon">
            <FiInfo />
            <span className="tooltip-text">
              Введите название ссылки, как она будет отображаться.
            </span>
          </span>
        </label>
        <input
          type="text"
          placeholder="Введите название ссылки"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
        />
      </div>

      <div className="input-group">
        <label>
          URL сайта
          <span className="tooltip-icon">
            <FiInfo />
            <span className="tooltip-text">
              Введите URL сайта, например, https://example.com
            </span>
          </span>
        </label>
        <input
          type="url"
          placeholder="https://example.com"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          required
        />
      </div>

      <div className="input-group">
        <label>
          Иконка
          <span className="tooltip-icon">
            <FiInfo />
            <span className="tooltip-text">
              Выберите изображение для иконки блока (необязательно).
            </span>
          </span>
        </label>
        <input type="file" accept="image/*" onChange={handleFileChange} />
      </div>

      <div className="input-group" style={{ overflow: 'visible' }}>
        <label>
          Категория
          <span className="tooltip-icon">
            <FiInfo />
            <span className="tooltip-text">
              Введите название категории. Для избранных введите "favorite".
            </span>
          </span>
        </label>
        <input
          type="text"
          placeholder="favorite или другое название"
          value={category}
          onChange={handleCategoryChange}
          onFocus={handleCategoryFocus}
          onBlur={handleCategoryBlur}
          onKeyDown={handleCategoryKeyDown}
        />

        {showCatDropdown && filteredCats.length > 0 && (
          <ul className="category-dropdown" ref={dropdownRef}>
            {filteredCats.map((catItem) => (
              <li
                key={catItem}
                onMouseDown={(e) => {
                  e.preventDefault();
                  selectCategory(catItem);
                }}
              >
                {catItem}
              </li>
            ))}
          </ul>
        )}
      </div>

      <button type="submit">Добавить ссылку</button>
    </form>
  );
}

export default LinkForm;

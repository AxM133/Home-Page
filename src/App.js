import React, { useState, useEffect, useRef } from 'react';
import { FiMoreHorizontal } from 'react-icons/fi';
import './App.css';

import LinkBlock from './components/LinkBlock';
import SidebarMenu from './components/SidebarMenu';
import WeatherWidget from './components/WeatherWidget';
import ClockWidget from './components/ClockWidget';
import TodoWidget from './components/widgets/TodoWidget';

import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';

// Функция для группировки (по category)
function groupBy(array, keyFn) {
  const result = {};
  array.forEach((item) => {
    const key = keyFn(item);
    if (!result[key]) {
      result[key] = [];
    }
    result[key].push(item);
  });
  return result;
}

function App() {
  const [theme, setTheme] = useState('light');
  const [links, setLinks] = useState([]);
  const [isRemoveMode, setIsRemoveMode] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [sortBy, setSortBy] = useState('manual');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [editIndex, setEditIndex] = useState(null);
  const fileInputRef = useRef(null);

  // Какая категория открыта в «папке» (для More)
  const [folderOpenCat, setFolderOpenCat] = useState(null);

  useEffect(() => {
    const storedTheme = localStorage.getItem('theme');
    if (storedTheme) {
      setTheme(storedTheme);
    }

    const storedLinks = localStorage.getItem('userLinks');
    if (storedLinks) {
      setLinks(JSON.parse(storedLinks));
    } else {
      // Пример начальных ссылок
      setLinks([
        {
          title: 'Google',
          url: 'https://www.google.com',
          customIcon: '',
          category: 'favorite',
          createdAt: Date.now(),
        },
        {
          title: 'YouTube',
          url: 'https://www.youtube.com',
          customIcon: '',
          category: 'video',
          createdAt: Date.now(),
        },
      ]);
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('theme', theme);
  }, [theme]);

  useEffect(() => {
    localStorage.setItem('userLinks', JSON.stringify(links));
  }, [links]);

  // Добавляем/убираем классы .light / .dark на html
  useEffect(() => {
    document.documentElement.classList.remove('light', 'dark');
    document.documentElement.classList.add(theme);
  }, [theme]);

  // ==== ФУНКЦИИ ====
  const toggleTheme = () => {
    setTheme((prev) => (prev === 'light' ? 'dark' : 'light'));
  };

  const toggleRemoveMode = () => {
    setIsRemoveMode((prev) => !prev);
  };

  const handleAddLink = (newLink) => {
    const isDuplicate = links.some((link) => link.url === newLink.url);
    if (isDuplicate) {
      alert('Такая ссылка уже добавлена!');
      return;
    }
    setLinks((prev) => [...prev, newLink]);
  };

  const handleRemoveLink = (index) => {
    setLinks((prev) => prev.filter((_, i) => i !== index));
  };

  const handleMenuToggle = () => {
    setIsMenuOpen((prev) => !prev);
  };

  const handleEditLink = (index) => {
    setEditIndex(index);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
      fileInputRef.current.click();
    }
  };

  const handleSelectFile = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
      const base64Data = evt.target.result;
      setLinks((prev) => {
        const updated = [...prev];
        updated[editIndex] = {
          ...updated[editIndex],
          customIcon: base64Data,
        };
        return updated;
      });
    };
    reader.readAsDataURL(file);
  };

  // ==== ФИЛЬТРАЦИЯ и СОРТИРОВКА ====
  // Всегда показываем favorite + выбранную категорию
  // Если выбрано "All", показываем все
  let filteredLinks;
  if (selectedCategory === 'All') {
    filteredLinks = links; // все
  } else {
    filteredLinks = links.filter(link =>
      link.category === 'favorite' || link.category === selectedCategory
    );
  }

  // Сортировка
  const sortedLinks = [...filteredLinks];
  if (sortBy === 'alphabetical') {
    sortedLinks.sort((a, b) =>
      a.title.localeCompare(b.title, 'ru', { sensitivity: 'base' })
    );
  } else if (sortBy === 'date') {
    sortedLinks.sort((a, b) => b.createdAt - a.createdAt);
  }
  // manual => Drag & Drop

  // ==== Drag & Drop ====
  const onDragEnd = (result) => {
    if (!result.destination) return;
    if (sortBy !== 'manual') return;
    // В логике, если selectedCategory !== 'All', drag & drop не работает
    if (selectedCategory !== 'All') return;

    const fromIndex = result.source.index;
    const toIndex = result.destination.index;
    const movingItem = sortedLinks[fromIndex];
    const newLinks = [...links];

    const globalIndex = links.findIndex((l) => l === movingItem);
    newLinks.splice(globalIndex, 1);

    const targetItem = sortedLinks[toIndex];
    const globalIndexTarget = links.findIndex((l) => l === targetItem);
    newLinks.splice(globalIndexTarget, 0, movingItem);

    setLinks(newLinks);
  };

  // === Разделяем "favorite" от прочих
  const favoriteLinks = sortedLinks.filter(l => l.category === 'favorite');
  const otherLinks = sortedLinks.filter(l => l.category !== 'favorite');

  // Группировка по category
  const grouped = groupBy(otherLinks, (link) => link.category || 'Без категории');
  const groupedCategories = Object.keys(grouped).map((catName) => ({
    name: catName,
    items: grouped[catName],
  }));

  // Рендер избранных
  const renderFavoriteLinks = () => {
    return favoriteLinks.map((link, index) => (
      <Draggable
        key={`fav-${index}`}
        draggableId={`fav-drag-${index}`}
        index={index}
        isDragDisabled={sortBy !== 'manual'}
      >
        {(provided) => (
          <div
            ref={provided.innerRef}
            {...provided.draggableProps}
            {...provided.dragHandleProps}
            style={provided.draggableProps.style}
          >
            <LinkBlock
              title={link.title}
              url={link.url}
              customIcon={link.customIcon}
              isRemoveMode={isRemoveMode}
              onRemove={() => {
                const globalIndex = links.indexOf(link);
                if (globalIndex >= 0) handleRemoveLink(globalIndex);
              }}
              onEdit={() => {
                const globalIndex = links.indexOf(link);
                if (globalIndex >= 0) handleEditLink(globalIndex);
              }}
            />
          </div>
        )}
      </Draggable>
    ));
  };

  // Рендер категорий (2×2, если 4-й - папка more)
  const renderCategories = () => {
    return groupedCategories.map(catBlock => {
      const firstThree = catBlock.items.slice(0, 3);
      const hasMore = catBlock.items.length > 3;

      return (
        <div key={catBlock.name} className="category-section">
          <h3>{catBlock.name}</h3>
          <div className="category-links">
            {firstThree.map((link, idx) => (
              <LinkBlock
                key={`cat-${catBlock.name}-${idx}`}
                title={link.title}
                url={link.url}
                customIcon={link.customIcon}
                isRemoveMode={isRemoveMode}
                onRemove={() => {
                  const globalIndex = links.indexOf(link);
                  if (globalIndex >= 0) handleRemoveLink(globalIndex);
                }}
                onEdit={() => {
                  const globalIndex = links.indexOf(link);
                  if (globalIndex >= 0) handleEditLink(globalIndex);
                }}
              />
            ))}

            {hasMore && (
              <div
                className="link-block-wrapper folder-block"
                onClick={() => setFolderOpenCat(catBlock.name)}
              >
                <div className="link-block folder-block-inner">
                  <div className="icon-wrapper">
                    <FiMoreHorizontal className="folder-more-icon" />
                  </div>
                  <div className="tooltip">Показать ещё</div>
                </div>
              </div>
            )}
          </div>
        </div>
      );
    });
  };

  // Модалка (папка)
  const openFolderItems = folderOpenCat
    ? groupedCategories.find(cat => cat.name === folderOpenCat)?.items
    : null;

  // Собираем все категории (кроме favorite) + 'All'
  const allCategories = ['All', ...new Set(links
    .filter(l => l.category !== 'favorite')  // если хотите исключить favorite
    .map(l => l.category)
    .filter(Boolean)
  )];

  return (
    <div className={`App ${theme}`}>

      {/* Гамбургер */}
      <div>
        <input
          type="checkbox"
          id="checkbox"
          className="menu-btn"
          onClick={handleMenuToggle}
        />
        <label htmlFor="checkbox" className="toggle">
          <div className="bars" id="bar1" />
          <div className="bars" id="bar2" />
          <div className="bars" id="bar3" />
        </label>
      </div>

      <SidebarMenu
        isOpen={isMenuOpen}
        onClose={handleMenuToggle}
        onAddLink={handleAddLink}
        toggleTheme={toggleTheme}
        toggleRemoveMode={toggleRemoveMode}
      />

      <input
        type="file"
        ref={fileInputRef}
        style={{ display: 'none' }}
        accept="image/*"
        onChange={handleSelectFile}
      />

      <main>
        {/* Избранные */}
        <DragDropContext onDragEnd={onDragEnd}>
          <Droppable droppableId="favorites-droppable" direction="horizontal">
            {(provided) => (
              <section
                className="favorites-row"
                ref={provided.innerRef}
                {...provided.droppableProps}
              >
                <h2>Избранные</h2>
                <div className="favorites-links">
                  {renderFavoriteLinks()}
                  {provided.placeholder}
                </div>
              </section>
            )}
          </Droppable>
        </DragDropContext>

        {/* ПАНЕЛЬ: сортировка и выбор категории */}
        <section className="sorting-category-panel">
          <div className="sort-block">
            <h4>Сортировка</h4>
            <select value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
              <option value="manual">Ручная (Drag & Drop)</option>
              <option value="alphabetical">По алфавиту</option>
              <option value="date">По дате (новые сверху)</option>
            </select>
          </div>

          <div className="category-block">
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
        </section>

        {/* Сетка категорий (favorite уже добавляется автоматически через filteredLinks) */}
        <section className="categories-grid">
          {renderCategories()}
        </section>

        <section className="widgets-section">
          <WeatherWidget theme={theme} />
          <ClockWidget />
          <TodoWidget theme={theme} />
        </section>
      </main>

      {/* Модальное окно папки */}
      {folderOpenCat && (
        <div className="folder-modal-overlay" onClick={() => setFolderOpenCat(null)}>
          <div className="folder-modal-content" onClick={(e) => e.stopPropagation()}>
            <button className="folder-close" onClick={() => setFolderOpenCat(null)}>
              ×
            </button>
            <h2>Категория: {folderOpenCat}</h2>
            <div className="folder-links">
              {openFolderItems?.map((link, idx) => (
                <LinkBlock
                  key={`folder-${folderOpenCat}-${idx}`}
                  title={link.title}
                  url={link.url}
                  customIcon={link.customIcon}
                  isRemoveMode={isRemoveMode}
                  onRemove={() => {
                    const globalIndex = links.indexOf(link);
                    if (globalIndex >= 0) handleRemoveLink(globalIndex);
                  }}
                  onEdit={() => {
                    const globalIndex = links.indexOf(link);
                    if (globalIndex >= 0) handleEditLink(globalIndex);
                  }}
                />
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;

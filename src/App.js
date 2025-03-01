import React, { useState, useEffect, useRef } from 'react';
import './App.css';

import LinkBlock from './components/LinkBlock';
import SidebarMenu from './components/SidebarMenu';
import WeatherWidget from './components/WeatherWidget';
import ClockWidget from './components/ClockWidget';
import TodoWidget from './components/widgets/TodoWidget';

import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';

// Функция для группировки массива по значению (например, по category)
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

  // Считываем тему и ссылки из localStorage при загрузке
  useEffect(() => {
    const storedTheme = localStorage.getItem('theme');
    if (storedTheme) {
      setTheme(storedTheme);
    }

    const storedLinks = localStorage.getItem('userLinks');
    if (storedLinks) {
      setLinks(JSON.parse(storedLinks));
    } else {
      // Пример начального массива ссылок
      setLinks([
        {
          title: 'Google',
          url: 'https://www.google.com',
          customIcon: '',
          category: 'favorite', // По умолчанию, избранное
          createdAt: Date.now(),
        },
        {
          title: 'YouTube',
          url: 'https://www.youtube.com',
          customIcon: '',
          category: '',
          createdAt: Date.now(),
        },
      ]);
    }
  }, []);

  // Сохраняем тему
  useEffect(() => {
    localStorage.setItem('theme', theme);
  }, [theme]);

  // Сохраняем массив ссылок
  useEffect(() => {
    localStorage.setItem('userLinks', JSON.stringify(links));
  }, [links]);

  // Навешиваем класс .light / .dark на html
  useEffect(() => {
    document.documentElement.classList.remove('light', 'dark');
    document.documentElement.classList.add(theme);
  }, [theme]);

  // ==== Функции ====
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
    setLinks((prevLinks) => [...prevLinks, newLink]);
  };

  const handleRemoveLink = (index) => {
    setLinks((prevLinks) => prevLinks.filter((_, i) => i !== index));
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
      setLinks((prevLinks) => {
        const updated = [...prevLinks];
        updated[editIndex] = {
          ...updated[editIndex],
          customIcon: base64Data,
        };
        return updated;
      });
    };
    reader.readAsDataURL(file);
  };

  // ==== Фильтрация и сортировка ====
  const filteredLinks =
    selectedCategory === 'All'
      ? links
      : links.filter((link) => link.category === selectedCategory);

  const sortedLinks = [...filteredLinks];
  if (sortBy === 'alphabetical') {
    sortedLinks.sort((a, b) =>
      a.title.localeCompare(b.title, 'ru', { sensitivity: 'base' })
    );
  } else if (sortBy === 'date') {
    sortedLinks.sort((a, b) => b.createdAt - a.createdAt);
  }
  // manual => используется Drag & Drop

  // ==== Drag & Drop ====
  const onDragEnd = (result) => {
    if (!result.destination) return;
    if (sortBy !== 'manual') return;
    // Чтобы Drag & Drop работал корректно, 
    // мы проверяем, надо ли переставлять
    if (selectedCategory !== 'All') return;

    const fromIndex = result.source.index;
    const toIndex = result.destination.index;
    const movingItem = sortedLinks[fromIndex];

    const newLinks = Array.from(links);
    const globalIndex = links.findIndex((l) => l === movingItem);
    newLinks.splice(globalIndex, 1);

    const targetItem = sortedLinks[toIndex];
    const globalIndexTarget = links.findIndex((l) => l === targetItem);
    newLinks.splice(globalIndexTarget, 0, movingItem);

    setLinks(newLinks);
  };

  // ==== Разделяем ссылки на избранные (favorite) и прочие ====
  const favoriteLinks = sortedLinks.filter((l) => l.category === 'favorite');
  const otherLinks = sortedLinks.filter((l) => l.category !== 'favorite');

  // Группируем прочие по category (если category === '' => "Без категории")
  const grouped = groupBy(otherLinks, (link) => link.category || 'Без категории');
  // превращаем в массив [{ name, items }, ...]
  const groupedCategories = Object.keys(grouped).map((catName) => ({
    name: catName,
    items: grouped[catName],
  }));

  // ==== Рендер избранных ====
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

  // ==== Рендер категорий ====
  const renderCategories = () => {
    return groupedCategories.map((catBlock) => (
      <div key={catBlock.name} className="category-section">
        <h3>{catBlock.name}</h3>
        <div className="category-links">
          {catBlock.items.map((link, index) => (
            <LinkBlock
              key={`cat-${catBlock.name}-${index}`}
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
    ));
  };

  // Определяем список категорий для Sidebar'а
  const categories = [
    'All',
    ...new Set(links.map((l) => l.category).filter(Boolean)),
  ];

  return (
    <div className={`App ${theme}`}>

      {/* Кнопка-гамбургер (checkbox) */}
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

      {/* Sidebar */}
      <SidebarMenu
        isOpen={isMenuOpen}
        onClose={handleMenuToggle}
        onAddLink={handleAddLink}
        toggleTheme={toggleTheme}
        toggleRemoveMode={toggleRemoveMode}
        sortBy={sortBy}
        setSortBy={setSortBy}
        selectedCategory={selectedCategory}
        setSelectedCategory={setSelectedCategory}
        allCategories={categories}
      />

      {/* input для редактирования иконки */}
      <input
        type="file"
        ref={fileInputRef}
        style={{ display: 'none' }}
        accept="image/*"
        onChange={handleSelectFile}
      />

      <main>
        {/* Drag & Drop */}
        <DragDropContext onDragEnd={onDragEnd}>

          {/* Избранные */}
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

          {/* Основная секция — это уже не Droppable (можно сделать при желании) */}
          <section className="categories-grid">
            {renderCategories()}
          </section>

        </DragDropContext>

        <section className="widgets-section">
          <WeatherWidget theme={theme} />
          <ClockWidget />
          <TodoWidget theme={theme} />
        </section>
      </main>
    </div>
  );
}

export default App;

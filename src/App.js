import React, { useState, useEffect, useRef } from 'react';
import { FiMoreHorizontal } from 'react-icons/fi';
import './App.css';

import LinkBlock from './components/LinkBlock';
import SidebarMenu from './components/SidebarMenu';
import WeatherWidget from './components/WeatherWidget';
import ClockWidget from './components/ClockWidget';
import TodoWidget from './components/widgets/TodoWidget';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';

function groupByStable(array, categoryOrder) {
  // Сначала группируем ссылки по категории.
  const grouped = {};
  array.forEach((item) => {
    const cat = item.category || 'Без категории';
    if (!grouped[cat]) {
      grouped[cat] = [];
    }
    grouped[cat].push(item);
  });

  // Строим массив по порядку categoryOrder
  const result = categoryOrder.map((catName) => {
    const items = grouped[catName] || [];
    return { name: catName, items };
  });

  // Если появились новые категории, которых нет в categoryOrder, добавим в конец
  Object.keys(grouped).forEach((catName) => {
    if (!categoryOrder.includes(catName)) {
      result.push({ name: catName, items: grouped[catName] });
    }
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

  // «Папка» (модальное окно)
  const [folderOpenCat, setFolderOpenCat] = useState(null);

  // Список категорий, чтобы они не перетасовывались
  const [categoryOrder, setCategoryOrder] = useState([]);

  useEffect(() => {
    const storedTheme = localStorage.getItem('theme');
    if (storedTheme) {
      setTheme(storedTheme);
    }
    const storedLinks = localStorage.getItem('userLinks');
    if (storedLinks) {
      setLinks(JSON.parse(storedLinks));
    } else {
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

  useEffect(() => {
    document.documentElement.classList.remove('light', 'dark');
    document.documentElement.classList.add(theme);
  }, [theme]);

  // При каждом изменении links — если появилась новая категория, добавим её в categoryOrder
  useEffect(() => {
    const allCats = links
      .filter((l) => l.category && l.category !== 'favorite')
      .map((l) => l.category);

    // Уникальные
    const uniqueCats = Array.from(new Set(allCats));
    // Мержим с categoryOrder (добавляя только те, которых ещё нет)
    setCategoryOrder((prev) => {
      const merged = [...prev];
      uniqueCats.forEach((cat) => {
        if (!merged.includes(cat)) {
          merged.push(cat);
        }
      });
      return merged;
    });
  }, [links]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'light' ? 'dark' : 'light'));
  };

  const toggleRemoveMode = () => {
    setIsRemoveMode((prev) => !prev);
  };

  const handleAddLink = (newLink) => {
    if (links.some((l) => l.url === newLink.url)) {
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

  // Фильтруем: либо все, либо favorite + категория
  let filteredLinks;
  if (selectedCategory === 'All') {
    filteredLinks = links;
  } else {
    filteredLinks = links.filter(
      (l) => l.category === 'favorite' || l.category === selectedCategory
    );
  }

  // Сортируем блоки
  const sortedLinks = [...filteredLinks];
  if (sortBy === 'alphabetical') {
    sortedLinks.sort((a, b) =>
      a.title.localeCompare(b.title, 'ru', { sensitivity: 'base' })
    );
  } else if (sortBy === 'date') {
    sortedLinks.sort((a, b) => b.createdAt - a.createdAt);
  }

  // DnD
  const onDragEnd = (result) => {
    if (!result.destination) return;
    if (sortBy !== 'manual') return;

    // Не даём перетаскивать между droppables


    if (result.source.droppableId === 'favorites-droppable') {
      reorderFavorites(result.source.index, result.destination.index);
    } else if (result.source.droppableId.startsWith('cat:')) {
      reorderCategory(
        result.source.droppableId.replace('cat:', ''),
        result.source.index,
        result.destination.index
      );
    }
  };

  // Перестановка в "Избранные" (horizontal)
  const reorderFavorites = (fromIndex, toIndex) => {
    setLinks((prev) => {
      const favLinks = prev.filter((l) => l.category === 'favorite');
      if (fromIndex >= favLinks.length || toIndex >= favLinks.length) return prev;
      const [removed] = favLinks.splice(fromIndex, 1);
      favLinks.splice(toIndex, 0, removed);
      const others = prev.filter((l) => l.category !== 'favorite');
      return [...others, ...favLinks];
    });
  };

  // Перестановка в одной категории
  const reorderCategory = (catName, fromIndex, toIndex) => {
    setLinks((prev) => {
      const newArr = [...prev];
      const catLinks = newArr.filter((l) => l.category === catName);
      // Только первые 3 двигаем
      const firstThree = catLinks.slice(0, 3);
      if (fromIndex >= firstThree.length || toIndex >= firstThree.length) {
        return newArr;
      }
      const [removed] = firstThree.splice(fromIndex, 1);
      firstThree.splice(toIndex, 0, removed);
      const rest = catLinks.slice(3);
      const finalCat = [...firstThree, ...rest];
      const notCat = newArr.filter((l) => l.category !== catName);
      return [...notCat, ...finalCat];
    });
  };

  // Разделяем на favorite/other
  const favoriteLinks = sortedLinks.filter((l) => l.category === 'favorite');
  const otherLinks = sortedLinks.filter((l) => l.category !== 'favorite');

  // Группируем по категории, но порядок — categoryOrder
  const groupedCategories = groupByStable(otherLinks, categoryOrder);

  const renderFavoriteLinks = () => {
    return favoriteLinks.map((link, index) => (
      <Draggable
        key={`fav-${index}`}
        draggableId={`fav-${index}`}
        index={index}
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
                const gIndex = links.indexOf(link);
                if (gIndex >= 0) handleRemoveLink(gIndex);
              }}
              onEdit={() => {
                const gIndex = links.indexOf(link);
                if (gIndex >= 0) handleEditLink(gIndex);
              }}
            />
          </div>
        )}
      </Draggable>
    ));
  };

  const renderCategories = () => {
    return groupedCategories.map((catBlock) => {
      const catName = catBlock.name;
      const firstThree = catBlock.items.slice(0, 3);
      const hasMore = catBlock.items.length > 3;

      return (
        <Droppable
          key={catName}
          droppableId={`cat:${catName}`}
          direction="vertical"
        >
          {(provided) => (
            <div className="category-section">
              <h3>{catName}</h3>
              <div
                className="category-links"
                ref={provided.innerRef}
                {...provided.droppableProps}
              >
                {firstThree.map((link, idx) => (
                  <Draggable
                    key={`cat-${catName}-${idx}`}
                    draggableId={`cat-${catName}-${idx}`}
                    index={idx}
                  >
                    {(provDrag) => (
                      <div
                        ref={provDrag.innerRef}
                        {...provDrag.draggableProps}
                        {...provDrag.dragHandleProps}
                        style={provDrag.draggableProps.style}
                      >
                        <LinkBlock
                          title={link.title}
                          url={link.url}
                          customIcon={link.customIcon}
                          isRemoveMode={isRemoveMode}
                          onRemove={() => {
                            const gIndex = links.indexOf(link);
                            if (gIndex >= 0) handleRemoveLink(gIndex);
                          }}
                          onEdit={() => {
                            const gIndex = links.indexOf(link);
                            if (gIndex >= 0) handleEditLink(gIndex);
                          }}
                        />
                      </div>
                    )}
                  </Draggable>
                ))}
                {hasMore && (
                  <div
                    className="link-block-wrapper folder-block"
                    onClick={() => setFolderOpenCat(catName)}
                  >
                    <div className="link-block folder-block-inner">
                      <div className="icon-wrapper">
                        <FiMoreHorizontal className="folder-more-icon" />
                      </div>
                      <div className="tooltip">Показать ещё</div>
                    </div>
                  </div>
                )}
                {provided.placeholder}
              </div>
            </div>
          )}
        </Droppable>
      );
    });
  };

  // Папка (модальное окно)
  const openFolderItems = folderOpenCat
    ? groupedCategories.find((c) => c.name === folderOpenCat)?.items
    : null;

  // Список категорий + All
  const allCategories = [
    'All',
    ...new Set(
      links
        .filter((l) => l.category !== 'favorite')
        .map((l) => l.category)
        .filter(Boolean)
    ),
  ];

  return (
    <div className={`App ${theme}`}>
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

      <DragDropContext onDragEnd={onDragEnd}>
        <main>
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

          <section className="categories-grid">
            {renderCategories()}
          </section>

          <section className="widgets-section">
            <WeatherWidget theme={theme} />
            <ClockWidget />
            <TodoWidget theme={theme} />
          </section>
        </main>
      </DragDropContext>

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
                    const gIndex = links.indexOf(link);
                    if (gIndex >= 0) handleRemoveLink(gIndex);
                  }}
                  onEdit={() => {
                    const gIndex = links.indexOf(link);
                    if (gIndex >= 0) handleEditLink(gIndex);
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

import React, { useState, useEffect, useRef } from 'react';
import { FiMoreHorizontal, FiList, FiMenu } from 'react-icons/fi';
import './App.css';
import LinkBlock from './components/LinkBlock';
import SidebarMenu from './components/SidebarMenu';
import WeatherWidget from './components/WeatherWidget';
import ClockWidget from './components/ClockWidget';
import TodoWidget from './components/widgets/TodoWidget';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';

function groupByStable(array, categoryOrder) {
  const grouped = {};
  array.forEach((item) => {
    const cat = item.category || 'Без категории';
    if (!grouped[cat]) {
      grouped[cat] = [];
    }
    grouped[cat].push(item);
  });

  const result = categoryOrder.map((catName) => ({
    name: catName,
    items: grouped[catName] || [],
  }));

  Object.keys(grouped).forEach((catName) => {
    if (!categoryOrder.includes(catName)) {
      result.push({ name: catName, items: grouped[catName] });
    }
  });

  return result;
}

function App() {
  const initialTheme = document.documentElement.classList.contains('dark') ? 'dark' : 'light';
  const [theme, setTheme] = useState(initialTheme);

  const [links, setLinks] = useState([]);
  const [isRemoveMode, setIsRemoveMode] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [sortBy] = useState('manual');
  const [selectedCategory, setSelectedCategory] = useState('All');

  const [editIndex, setEditIndex] = useState(null);
  const fileInputRef = useRef(null);

  const [folderOpenCat, setFolderOpenCat] = useState(null);
  const [categoryOrder, setCategoryOrder] = useState([]);

  const [showCategoryOptions, setShowCategoryOptions] = useState(false);

  useEffect(() => {
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
    localStorage.setItem('userLinks', JSON.stringify(links));
  }, [links]);

  const toggleTheme = () => {
    if (theme === 'dark') {
      document.documentElement.classList.remove('dark');
      document.documentElement.classList.add('light');
      localStorage.setItem('theme', 'light');
      setTheme('light');
    } else {
      document.documentElement.classList.remove('light');
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
      setTheme('dark');
    }
  };

  useEffect(() => {
    localStorage.setItem('theme', theme);
  }, [theme]);

  // Собираем уникальные категории, исключая 'favorite'
  useEffect(() => {
    const cats = links
      .filter((l) => l.category && l.category !== 'favorite')
      .map((l) => l.category);
    const uniqueCats = Array.from(new Set(cats));
    setCategoryOrder(uniqueCats);
  }, [links]);

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

  let filteredLinks;
  if (selectedCategory === 'All') {
    filteredLinks = links;
  } else {
    filteredLinks = links.filter(
      (l) => l.category === 'favorite' || l.category === selectedCategory
    );
  }

  const sortedLinks = [...filteredLinks];
  if (sortBy === 'alphabetical') {
    sortedLinks.sort((a, b) =>
      a.title.localeCompare(b.title, 'ru', { sensitivity: 'base' })
    );
  } else if (sortBy === 'date') {
    sortedLinks.sort((a, b) => b.createdAt - a.createdAt);
  }

  const onDragEnd = (result) => {
    if (!result.destination) return;
    if (sortBy !== 'manual') return;
    if (result.source.droppableId !== result.destination.droppableId) return;

    if (result.source.droppableId === 'favorites-droppable') {
      reorderFavorites(result.source.index, result.destination.index);
    } else if (result.source.droppableId.startsWith('cat:')) {
      const cat = result.source.droppableId.replace('cat:', '');
      reorderCategory(cat, result.source.index, result.destination.index);
    }
  };

  const reorderFavorites = (from, to) => {
    setLinks((prev) => {
      const favorites = prev.filter((l) => l.category === 'favorite');
      if (from >= favorites.length || to >= favorites.length) return prev;
      const [removed] = favorites.splice(from, 1);
      favorites.splice(to, 0, removed);
      const others = prev.filter((l) => l.category !== 'favorite');
      return [...others, ...favorites];
    });
  };

  const reorderCategory = (catName, from, to) => {
    setLinks((prev) => {
      const newArr = [...prev];
      const catLinks = newArr.filter((l) => l.category === catName);
      const firstThree = catLinks.slice(0, 3);
      if (from >= firstThree.length || to >= firstThree.length) return newArr;

      const [removed] = firstThree.splice(from, 1);
      firstThree.splice(to, 0, removed);
      const rest = catLinks.slice(3);
      const finalCat = [...firstThree, ...rest];
      const notCat = newArr.filter((l) => l.category !== catName);
      return [...notCat, ...finalCat];
    });
  };

  // Ссылки категории favorite отдельно, остальные в otherLinks
  const favoriteLinks = sortedLinks.filter((l) => l.category === 'favorite');
  const otherLinks = sortedLinks.filter((l) => l.category !== 'favorite');

  // Группируем только "otherLinks"
  const groupedCategories = groupByStable(otherLinks, categoryOrder);

  let visibleCategories;
  if (selectedCategory === 'All') {
    visibleCategories = groupedCategories;
  } else {
    const singleCat = groupedCategories.find((c) => c.name === selectedCategory);
    visibleCategories = singleCat ? [singleCat] : [];
  }

  const renderCategories = () => {
    return visibleCategories.map((catBlock) => {
      const catName = catBlock.name;
      const firstThree = catBlock.items.slice(0, 3);
      const hasMore = catBlock.items.length > 3;
      return (
        <Droppable key={catName} droppableId={`cat:${catName}`} direction="vertical">
          {(provided) => (
            <div className="category-section">
              <h3>{catName}</h3>
              <div className="category-links" ref={provided.innerRef} {...provided.droppableProps}>
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
                        style={{
                          ...provDrag.draggableProps.style,
                          transition: 'all 0.2s ease',
                        }}
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

  // Если открыта папка (Показать ещё)
  const openFolderItems = folderOpenCat
    ? groupedCategories.find((c) => c.name === folderOpenCat)?.items
    : null;

  // Для иконки "категория" справа — список "All" + все остальные (без favorite)
  const catSelectList = ['All', ...categoryOrder];

  return (
    <div className="App">
      <button
        className={`menu-toggle-button ${isMenuOpen ? 'active' : ''}`}
        onClick={handleMenuToggle}
      >
        <FiMenu size={18} />
        <span>Меню</span>
      </button>

      <SidebarMenu
        isOpen={isMenuOpen}
        onClose={handleMenuToggle}
        onAddLink={handleAddLink}
        toggleTheme={toggleTheme}
        currentTheme={theme}
        toggleRemoveMode={toggleRemoveMode}
        availableCategories={categoryOrder}
      />

      <input
        type="file"
        ref={fileInputRef}
        style={{ display: 'none' }}
        accept="image/*"
        onChange={handleSelectFile}
      />

      {/* Кнопка "Категория" справа */}
      <div
        className="category-icon-button"
        onClick={() => setShowCategoryOptions((s) => !s)}
      >
        <span className="cat-icon">
          <FiList />
        </span>
        <span className="cat-tooltip">Категория</span>
        {showCategoryOptions && (
          <div className="custom-cat-options">
            {catSelectList.map((cat) => (
              <div
                key={cat}
                className={`cat-option ${selectedCategory === cat ? 'active' : ''}`}
                onClick={() => {
                  setSelectedCategory(cat);
                  setShowCategoryOptions(false);
                }}
              >
                {cat}
              </div>
            ))}
          </div>
        )}
      </div>

      <DragDropContext onDragEnd={onDragEnd}>
        <main>
          {/* Блок "Избранные" */}
          <Droppable droppableId="favorites-droppable" direction="horizontal">
            {(provided) => (
              <section
                className="favorites-row"
                ref={provided.innerRef}
                {...provided.droppableProps}
              >
                <h2>Избранные</h2>
                <div className="favorites-links">
                  {favoriteLinks.map((link, index) => (
                    <Draggable
                      key={`fav-${index}`}
                      draggableId={`fav-${index}`}
                      index={index}
                    >
                      {(provProvided) => (
                        <div
                          ref={provProvided.innerRef}
                          {...provProvided.draggableProps}
                          {...provProvided.dragHandleProps}
                          style={provProvided.draggableProps.style}
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
                  {provided.placeholder}
                </div>
              </section>
            )}
          </Droppable>

          {/* Остальные категории */}
          <section
            className="categories-grid"
            style={selectedCategory !== 'All' ? { justifyContent: 'center' } : undefined}
          >
            {renderCategories()}
          </section>

          {/* Виджеты */}
          <section className="widgets-section">
            <WeatherWidget theme={theme} />
            <ClockWidget />
            <TodoWidget theme={theme} />
          </section>
        </main>
      </DragDropContext>

      {/* Модальное окно, если нажали "Показать ещё" */}
      {folderOpenCat && (
        <div className="folder-modal-overlay" onClick={() => setFolderOpenCat(null)}>
          <div
            className="folder-modal-content"
            onClick={(e) => e.stopPropagation()}
          >
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

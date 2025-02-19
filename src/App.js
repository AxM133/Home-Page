import React, { useState, useEffect, useRef } from 'react';
import './App.css';
import LinkBlock from './components/LinkBlock';
import SidebarMenu from './components/SidebarMenu';
import WeatherWidget from './components/WeatherWidget';
import ClockWidget from './components/ClockWidget';
import TodoWidget from './components/widgets/TodoWidget';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';

function App() {
  const [theme, setTheme] = useState('light');
  const [links, setLinks] = useState([]);
  const [isRemoveMode, setIsRemoveMode] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [sortBy, setSortBy] = useState('manual');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [editIndex, setEditIndex] = useState(null);
  const fileInputRef = useRef(null);

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
          category: '',
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

  useEffect(() => {
    localStorage.setItem('theme', theme);
  }, [theme]);

  useEffect(() => {
    localStorage.setItem('userLinks', JSON.stringify(links));
  }, [links]);

  useEffect(() => {
    // При изменении theme - снимаем оба класса и вешаем текущий
    document.documentElement.classList.remove('light', 'dark');
    document.documentElement.classList.add(theme);
  }, [theme]);

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

  const onDragEnd = (result) => {
    if (!result.destination) return;
    if (sortBy !== 'manual') return;
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

  const renderLinks = () => {
    return sortedLinks.map((link, index) => (
      <Draggable
        key={index}
        draggableId={`link-${index}`}
        index={index}
        isDragDisabled={sortBy !== 'manual' || selectedCategory !== 'All'}
      >
        {(provided) => (
          <div
            ref={provided.innerRef}
            {...provided.draggableProps}
            {...provided.dragHandleProps}
            style={provided.draggableProps.style}
          >
            <LinkBlock
              key={index}
              title={link.title}
              url={link.url}
              customIcon={link.customIcon}
              isRemoveMode={isRemoveMode}
              onRemove={() => handleRemoveLink(index)}
              onEdit={() => handleEditLink(index)}
            />
          </div>
        )}
      </Draggable>
    ));
  };

  const categories = [
    'All',
    ...new Set(links.map((l) => l.category).filter(Boolean)),
  ];

  return (
    <div className={`App ${theme}`}>

      <div>
        <input type="checkbox" id="checkbox" className='menu-btn' onClick={handleMenuToggle}/>
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
        sortBy={sortBy}
        setSortBy={setSortBy}
        selectedCategory={selectedCategory}
        setSelectedCategory={setSelectedCategory}
        allCategories={categories}
      />

      <input
        type="file"
        ref={fileInputRef}
        style={{ display: 'none' }}
        accept="image/*"
        onChange={handleSelectFile}
      />

      <main>
        <DragDropContext onDragEnd={onDragEnd}>
          <Droppable droppableId="links-droppable" direction="horizontal">
            {(provided) => (
              <section
                className="links-section"
                ref={provided.innerRef}
                {...provided.droppableProps}
              >
                {renderLinks()}
                {provided.placeholder}
              </section>
            )}
          </Droppable>
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
import React, { useState, useEffect, useRef } from 'react';
import './TodoWidget.css';
import { FaFlag, FaRegFlag, FaCalendarAlt } from 'react-icons/fa';

function TodoWidget({ theme }) {
  const [tasks, setTasks] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Поля для новой задачи
  const [titleInput, setTitleInput] = useState('');
  const [priority, setPriority] = useState('low');
  const [deadline, setDeadline] = useState('');

  // Фильтр и сортировка
  const [filter, setFilter] = useState('all');     // 'all' | 'done' | 'open'
  const [sortTaskBy, setSortTaskBy] = useState('created'); // 'created' | 'priority' | 'deadline'

  // Скрытый input type="date"
  const dateInputRef = useRef(null);

  useEffect(() => {
    const storedTasks = localStorage.getItem('advancedTodoTasks');
    if (storedTasks) {
      setTasks(JSON.parse(storedTasks));
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('advancedTodoTasks', JSON.stringify(tasks));
  }, [tasks]);

  // Автоудаление задач, которые выполнены более 24 часов назад
  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now();
      setTasks(prev =>
        prev.filter(task => {
          if (!task.completed) return true;
          if (!task.completedAt) return true;
          return now - task.completedAt < 24 * 60 * 60 * 1000;
        })
      );
    }, 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  const openModal = () => setIsModalOpen(true);
  const closeModal = (e) => {
    e.stopPropagation();
    setIsModalOpen(false);
  };

  const handleWidgetClick = () => {
    openModal();
  };

  // При добавлении задачи
  const handleAddTask = () => {
    if (titleInput.trim() === '') return;
    const newTask = {
      id: Date.now(),
      title: titleInput.trim().toUpperCase(),
      priority,
      deadline,
      completed: false,
      completedAt: null,
      createdAt: Date.now(),
    };
    setTasks(prev => [...prev, newTask]);
    setTitleInput('');
    setPriority('low');
    setDeadline('');
  };

  // Переключение выполнения
  const toggleTask = (id) => {
    setTasks(prev =>
      prev.map(task => {
        if (task.id === id) {
          if (!task.completed) {
            return { ...task, completed: true, completedAt: Date.now() };
          } else {
            return { ...task, completed: false, completedAt: null };
          }
        }
        return task;
      })
    );
  };

  // Удалить задачу
  const removeTask = (id) => {
    setTasks(prev => prev.filter(task => task.id !== id));
  };

  // Приоритет: кликами по кнопке (low -> medium -> high -> low)
  const cyclePriority = () => {
    if (priority === 'low') setPriority('medium');
    else if (priority === 'medium') setPriority('high');
    else setPriority('low');
  };

  // Нажатие на иконку календаря – открываем date
  const handleOpenDate = () => {
    if (dateInputRef.current) {
      dateInputRef.current.click();
    }
  };

  // Фильтрация и сортировка
  const filteredTasks = tasks.filter((task) => {
    if (filter === 'done') return task.completed;
    if (filter === 'open') return !task.completed;
    return true;
  });

  const sortedTasks = [...filteredTasks];
  if (sortTaskBy === 'priority') {
    const priorityOrder = { high: 3, medium: 2, low: 1 };
    sortedTasks.sort(
      (a, b) => priorityOrder[b.priority] - priorityOrder[a.priority]
    );
  } else if (sortTaskBy === 'deadline') {
    sortedTasks.sort((a, b) => {
      if (!a.deadline && !b.deadline) return 0;
      if (!a.deadline) return 1;
      if (!b.deadline) return -1;
      return new Date(a.deadline) - new Date(b.deadline);
    });
  } else {
    // 'created'
    sortedTasks.sort((a, b) => a.createdAt - b.createdAt);
  }

  // Показываем первые 2 задачи в mini-версии виджета
  const firstTwoTasks = sortedTasks.slice(0, 2);

  return (
    <>
      <div className="todo-widget widget" onClick={handleWidgetClick}>
        <div className="todo-small-title">СПИСОК ДЕЛ</div>
        <ul className="todo-small-list">
          {firstTwoTasks.map(task => (
            <li key={task.id} className={task.completed ? 'completed' : ''}>
              {task.title}
            </li>
          ))}
        </ul>
      </div>

      {isModalOpen && (
        <div className={`modal-overlay ${theme === 'dark' ? 'dark-overlay' : ''}`} onClick={closeModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <button className="close-modal" onClick={closeModal}>
              ×
            </button>

            <h2 className="modal-title">Список дел</h2>

            {/* Верхняя часть: input + "check" button справа */}
            <div className="top-row">
              <input
                type="text"
                className="task-input"
                placeholder="Новая задача..."
                value={titleInput}
                onChange={(e) => setTitleInput(e.target.value)}
              />
              <button className="add-check-btn" onClick={handleAddTask} title="Добавить задачу">
                +
              </button>
            </div>

            {/* Вторая строка: Priority + Deadline */}
            <div className="second-row">
              {/* Кнопка приоритета (3 иконки флажка) */}
              <button
                className={`priority-btn ${priority}`}
                onClick={cyclePriority}
                title="Приоритет"
              >
                {priority === 'low' && <FaRegFlag />}
                {priority === 'medium' && <FaFlag style={{ color: '#ffbf00' }} />}
                {priority === 'high' && <FaFlag style={{ color: '#ff3d3d' }} />}
              </button>

              {/* Кнопка дедлайна (открывает date) */}
              <button
                className="deadline-btn"
                onClick={handleOpenDate}
                title="Дедлайн"
              >
                <FaCalendarAlt />
              </button>

              <input
                type="date"
                ref={dateInputRef}
                style={{ display: 'none' }}
                value={deadline}
                onChange={(e) => setDeadline(e.target.value)}
              />
            </div>

            <hr />

            {/* Третья строка: фильтр и сортировка */}
            <div className="row-filters">
              <div>
                <label>Фильтр: </label>
                <select value={filter} onChange={(e) => setFilter(e.target.value)}>
                  <option value="all">Все</option>
                  <option value="done">Выполнено</option>
                  <option value="open">Осталось</option>
                </select>
              </div>

              <div>
                <label>Сортировка: </label>
                <select
                  value={sortTaskBy}
                  onChange={(e) => setSortTaskBy(e.target.value)}
                >
                  <option value="created">Дата добавления</option>
                  <option value="priority">Приоритет</option>
                  <option value="deadline">Дедлайн</option>
                </select>
              </div>
            </div>

            {/* Сами задачи */}
            <ul className="modal-todo-list">
              {sortedTasks.map((task) => (
                <li key={task.id}>
                  <div className="check-btn" onClick={() => toggleTask(task.id)}>
                    {task.completed ? '☑' : '☐'}
                  </div>

                  <div className="task-content">
                    <div className={`task-title ${task.completed ? 'done' : ''}`}>
                      {task.title}
                    </div>
                    <div className="task-meta">
                      <span className={`task-priority ${task.priority}`}>
                        {task.priority.toUpperCase()}
                      </span>
                      {task.deadline && (
                        <span className="task-deadline">Дедлайн: {task.deadline}</span>
                      )}
                    </div>
                  </div>

                  <button className="remove-todo" onClick={() => removeTask(task.id)}>
                    ×
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </>
  );
}

export default TodoWidget;

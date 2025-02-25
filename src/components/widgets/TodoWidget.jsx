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

  // Фильтрация и сортировка
  const [filter, setFilter] = useState('all');     
  const [sortTaskBy, setSortTaskBy] = useState('created'); 

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

  // Удаляем задачи, которые выполнены дольше 24 часов
  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now();
      setTasks(prev =>
        prev.filter(t => {
          if (!t.completed) return true;
          if (!t.completedAt) return true;
          return now - t.completedAt < 24 * 60 * 60 * 1000;
        })
      );
    }, 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  // Открыть / закрыть модальное окно
  const openModal = () => setIsModalOpen(true);
  const closeModal = (e) => {
    e.stopPropagation();
    setIsModalOpen(false);
  };

  const handleWidgetClick = () => {
    openModal();
  };

  // Добавить задачу
  const handleAddTask = () => {
    if (titleInput.trim() === '') return;
    const newTask = {
      id: Date.now(),
      title: titleInput.trim().toUpperCase(),
      priority,
      deadline,
      completed: false,
      completedAt: null,
      createdAt: Date.now()
    };
    setTasks(prev => [...prev, newTask]);
    setTitleInput('');
    setPriority('low');
    setDeadline('');
  };

  // Отметить задачу выполненной / невыполненной
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

  // Переключать приоритет (low -> medium -> high -> ...)
  const cyclePriority = () => {
    if (priority === 'low') setPriority('medium');
    else if (priority === 'medium') setPriority('high');
    else setPriority('low');
  };

  // Нажимаем на иконку календаря — открываем <input type="date" />
  const handleOpenDate = (e) => {
    e.preventDefault();
    // Если браузер поддерживает showPicker (Chrome), используем его
    if (dateInputRef.current && dateInputRef.current.showPicker) {
      dateInputRef.current.showPicker();
    } else if (dateInputRef.current) {
      // Фолбек: просто клик
      dateInputRef.current.click();
    }
  };

  // Фильтрация
  const filteredTasks = tasks.filter((task) => {
    if (filter === 'done') return task.completed;
    if (filter === 'open') return !task.completed;
    return true;
  });

  // Сортировка
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
    // 'created' => по времени создания, новые вниз
    sortedTasks.sort((a, b) => a.createdAt - b.createdAt);
  }

  // В мини-виджете (250 x 120) показываем только одну задачу
  const firstTask = sortedTasks[0];

  return (
    <>
      {/* Мини-виджет */}
      <div className="todo-widget widget" onClick={handleWidgetClick}>
        { firstTask ? (
          <>
            <div className="todo-small-title" title={firstTask.title}>
              {/* Обрезаем если слишком длинно через CSS */}
              {firstTask.title}
            </div>
            <div>
              У вас {tasks.length} задач
            </div>
          </>
        ) : (
          <div className="todo-small-title">
            Нет задач
          </div>
        )}
      </div>

      {/* Модальное окно */}
      {isModalOpen && (
        <div className={`modal-overlay ${theme === 'dark' ? 'dark-overlay' : ''}`} onClick={closeModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <button className="close-modal" onClick={closeModal}>
              ×
            </button>
            <h2 className="modal-title">Список дел</h2>

            {/* Верхняя часть: текстовое поле и зелёная «галочка» */}
            <div className="top-row">
              <input
                type="text"
                className="task-input"
                placeholder="Новая задача..."
                value={titleInput}
                onChange={(e) => setTitleInput(e.target.value)}
              />
              <button
                className="add-check-btn"
                onClick={handleAddTask}
                title="Добавить задачу"
              >
                +
              </button>
            </div>

            {/* Вторая строка: приоритет + дедлайн */}
            <div className="second-row">
              <button
                className={`priority-btn ${priority}`}
                onClick={cyclePriority}
                title="Приоритет"
              >
                {priority === 'low' && <FaRegFlag />}
                {priority === 'medium' && <FaFlag style={{ color: '#ffbf00' }} />}
                {priority === 'high' && <FaFlag style={{ color: '#ff3d3d' }} />}
              </button>

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

            {/* Кнопка на всю ширину (если нужно) */}
            {/* <button className="add-task-btn full-width" onClick={handleAddTask}>Добавить задачу</button> */}

            <hr />

            {/* Фильтр и сортировка */}
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

            <ul className="modal-todo-list">
              {sortedTasks.map((task) => (
                <li key={task.id}>
                  {/* Кнопка отметки слева */}
                  <div className="check-btn" onClick={() => toggleTask(task.id)}>
                    {task.completed ? '☑' : '☐'}
                  </div>

                  {/* Основной блок задачи */}
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

                  {/* Кнопка удаления справа */}
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

import React, { useState, useEffect } from 'react';
import './TodoWidget.css';

function TodoWidget({ theme }) {
  const [tasks, setTasks] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [titleInput, setTitleInput] = useState('');
  const [priorityInput, setPriorityInput] = useState('low');
  const [deadlineInput, setDeadlineInput] = useState('');
  const [filter, setFilter] = useState('all'); // 'all' | 'done' | 'open'
  const [sortTaskBy, setSortTaskBy] = useState('created'); // 'created' | 'priority' | 'deadline'

  useEffect(() => {
    const storedTasks = localStorage.getItem('advancedTodoTasks');
    if (storedTasks) {
      setTasks(JSON.parse(storedTasks));
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('advancedTodoTasks', JSON.stringify(tasks));
  }, [tasks]);

  const openModal = () => {
    setIsModalOpen(true);
  };

  const closeModal = (e) => {
    e.stopPropagation();
    setIsModalOpen(false);
  };

  const handleWidgetClick = () => {
    openModal();
  };

  const addTask = () => {
    if (titleInput.trim() === '') return;
    const newTask = {
      id: Date.now(),
      title: titleInput.trim(),
      priority: priorityInput,
      deadline: deadlineInput,
      completed: false,
      createdAt: Date.now(),
    };
    setTasks((prev) => [...prev, newTask]);
    setTitleInput('');
    setPriorityInput('low');
    setDeadlineInput('');
  };

  const toggleTask = (id) => {
    setTasks((prev) =>
      prev.map((task) =>
        task.id === id ? { ...task, completed: !task.completed } : task
      )
    );
  };

  const removeTask = (id) => {
    setTasks((prev) => prev.filter((task) => task.id !== id));
  };

  const filteredTasks = tasks.filter((task) => {
    if (filter === 'done') return task.completed;
    if (filter === 'open') return !task.completed;
    return true; // 'all'
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

  const firstTwoTasks = sortedTasks.slice(0, 2);

  return (
    <>
      <div className="todo-widget widget" onClick={handleWidgetClick}>
        <div className="todo-small-title">СПИСОК ДЕЛ</div>
        <ul className="todo-small-list">
          {firstTwoTasks.map((task) => (
            <li key={task.id} className={task.completed ? 'completed' : ''}>
              {task.title}
            </li>
          ))}
        </ul>
      </div>

      {isModalOpen && (
        <div
          className={`modal-overlay ${theme === 'dark' ? 'dark-overlay' : ''}`}
          onClick={closeModal}
        >
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <button className="close-modal" onClick={closeModal}>
              ×
            </button>
            <h2 className="modal-title">Список дел</h2>

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
                <label>Сортировать по: </label>
                <select
                  value={sortTaskBy}
                  onChange={(e) => setSortTaskBy(e.target.value)}
                >
                  <option value="created">Дате добавления</option>
                  <option value="priority">Приоритету</option>
                  <option value="deadline">Дедлайну</option>
                </select>
              </div>
            </div>

            <div className="modal-input-row">
              <input
                type="text"
                placeholder="Новая задача..."
                value={titleInput}
                onChange={(e) => setTitleInput(e.target.value)}
              />
            </div>

            <div className="row-priority-deadline">
              <div>
                <label>Приоритет: </label>
                <select
                  value={priorityInput}
                  onChange={(e) => setPriorityInput(e.target.value)}
                >
                  <option value="low">Низкий</option>
                  <option value="medium">Средний</option>
                  <option value="high">Высокий</option>
                </select>
              </div>
              <div>
                <label>Дедлайн: </label>
                <input
                  type="date"
                  value={deadlineInput}
                  onChange={(e) => setDeadlineInput(e.target.value)}
                />
              </div>
            </div>

            <button className="add-task-btn" onClick={addTask}>
              Добавить задачу
            </button>
            <hr />

            <ul className="modal-todo-list">
              {sortedTasks.map((task) => (
                <li
                  key={task.id}
                  className={task.completed ? 'completed' : ''}
                >
                  <div className="task-left" onClick={() => toggleTask(task.id)}>
                    <span className="task-title">{task.title}</span>
                    {task.deadline && (
                      <span className="task-deadline">до {task.deadline}</span>
                    )}
                    <span className={`task-priority ${task.priority}`}>
                      {task.priority === 'high' && 'Высокий'}
                      {task.priority === 'medium' && 'Средний'}
                      {task.priority === 'low' && 'Низкий'}
                    </span>
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

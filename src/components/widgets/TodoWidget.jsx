import React, { useState, useEffect } from 'react';
import './TodoWidget.css';
import { FaCheckCircle, FaTimesCircle } from 'react-icons/fa';

function getTaskWord(count) {
  const lastTwo = count % 100;
  const lastOne = count % 10;

  if (lastTwo >= 11 && lastTwo <= 14) {
    return 'задач';
  } else if (lastOne === 1) {
    return 'задача';
  } else if (lastOne >= 2 && lastOne <= 4) {
    return 'задачи';
  } else {
    return 'задач';
  }
}

function TodoWidget({ theme }) {
  const [tasks, setTasks] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [titleInput, setTitleInput] = useState('');
  const [descriptionInput, setDescriptionInput] = useState('');

  useEffect(() => {
    const storedTasks = localStorage.getItem('advancedTodoTasks');
    if (storedTasks) {
      setTasks(JSON.parse(storedTasks));
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('advancedTodoTasks', JSON.stringify(tasks));
  }, [tasks]);

  // Удаление выполненных задач через 24 часа
  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now();
      setTasks((prev) =>
        prev.filter((t) => !t.completed || now - t.completedAt < 24 * 60 * 60 * 1000)
      );
    }, 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  const openModal = () => setIsModalOpen(true);
  const closeModal = (e) => {
    e.stopPropagation();
    setIsModalOpen(false);
  };

  const handleWidgetClick = () => openModal();

  const handleAddTask = () => {
    if (titleInput.trim() === '') return;
    const newTask = {
      id: Date.now(),
      title: titleInput.trim(),
      description: descriptionInput.trim(),
      completed: false,
      completedAt: null,
      createdAt: Date.now(),
    };
    setTasks((prev) => [...prev, newTask]);
    setTitleInput('');
    setDescriptionInput('');
  };

  const toggleTask = (id) => {
    setTasks((prev) =>
      prev.map((task) =>
        task.id === id
          ? { ...task, completed: !task.completed, completedAt: task.completed ? null : Date.now() }
          : task
      )
    );
  };

  const removeTask = (id) => {
    setTasks((prev) => prev.filter((task) => task.id !== id));
  };

  return (
    <>
      {/* Виджет TODO */}
      <div className="todo-widget widget" onClick={handleWidgetClick}>
        <div className="todo-small-title">TODO</div>
        <div>
          У вас {tasks.length} {getTaskWord(tasks.length)}
        </div>
      </div>

      {/* Модальное окно */}
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

            {/* Поля ввода */}
            <div className="todo-inputs">
              <input
                type="text"
                className="task-input"
                placeholder="Название задачи..."
                value={titleInput}
                onChange={(e) => setTitleInput(e.target.value)}
              />
              <input
                type="text"
                className="task-input"
                placeholder="Описание (необязательно)..."
                value={descriptionInput}
                onChange={(e) => setDescriptionInput(e.target.value)}
              />
              <button className="add-task-btn" onClick={handleAddTask}>
                Добавить
              </button>
            </div>

            {/* Список задач */}
            <ul className="todo-list">
              {tasks.map((task) => (
                <li key={task.id} className={`todo-item ${task.completed ? 'completed' : ''}`}>
                  <div className="todo-text">
                    <strong>{task.title}</strong>
                    {task.description && <p>{task.description}</p>}
                  </div>
                  <div className="todo-actions">
                    <FaCheckCircle
                      className={`todo-check ${task.completed ? 'checked' : ''}`}
                      onClick={() => toggleTask(task.id)}
                    />
                    <FaTimesCircle className="todo-delete" onClick={() => removeTask(task.id)} />
                  </div>
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

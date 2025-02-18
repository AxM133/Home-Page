import React, { useState, useEffect } from 'react';
import './CalendarWidget.css';

function CalendarWidget() {
  const [today] = useState(new Date());
  const [reminders, setReminders] = useState([]);
  const [inputValue, setInputValue] = useState('');
  const [selectedDate, setSelectedDate] = useState('');

  useEffect(() => {
    const storedReminders = localStorage.getItem('calendarReminders');
    if (storedReminders) {
      setReminders(JSON.parse(storedReminders));
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('calendarReminders', JSON.stringify(reminders));
  }, [reminders]);

  const addReminder = () => {
    if (!selectedDate || inputValue.trim() === '') return;
    const newReminder = {
      id: Date.now(),
      date: selectedDate,
      text: inputValue.trim()
    };
    setReminders((prev) => [...prev, newReminder]);
    setInputValue('');
    setSelectedDate('');
  };

  const removeReminder = (id) => {
    setReminders((prev) => prev.filter((r) => r.id !== id));
  };

  const formatDate = (date) => {
    const d = new Date(date);
    return d.toLocaleDateString('ru-RU');
  };

  return (
    <div className="calendar-widget widget">
      <h3>Календарь / Напоминания</h3>
      <div className="calendar-today">
        <p>Сегодня: {today.toLocaleDateString('ru-RU')}</p>
      </div>
      <div className="reminder-input">
        <input
          type="date"
          value={selectedDate}
          onChange={(e) => setSelectedDate(e.target.value)}
        />
        <input
          type="text"
          placeholder="Текст напоминания..."
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
        />
        <button onClick={addReminder}>Добавить</button>
      </div>
      <ul className="reminder-list">
        {reminders.map((rem) => (
          <li key={rem.id}>
            <span className="reminder-date">{formatDate(rem.date)}:</span>
            <span className="reminder-text">{rem.text}</span>
            <button className="remove-reminder" onClick={() => removeReminder(rem.id)}>
              ×
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default CalendarWidget;

import React, { useState, useEffect } from 'react';
import './ClockWidget.css';

function ClockWidget() {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const timeStr = time.toLocaleTimeString('ru-RU', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });

  const dateStr = time.toLocaleDateString('ru-RU', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });

  return (
    <div className="clock-widget widget">
      <div className="clock-time">{timeStr}</div>
      <div className="clock-date">{dateStr}</div>
    </div>
  );
}

export default ClockWidget;

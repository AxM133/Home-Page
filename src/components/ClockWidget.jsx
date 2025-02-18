import React, { useState, useEffect } from 'react';
import './ClockWidget.css';

function ClockWidget() {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const hours = String(time.getHours()).padStart(2, '0');
  const minutes = String(time.getMinutes()).padStart(2, '0');
  const day = String(time.getDate()).padStart(2, '0');
  const month = String(time.getMonth() + 1).padStart(2, '0');
  const year = time.getFullYear();

  return (
    <div className="clock-widget widget">
      <div className="clock-time">
        {hours}:{minutes}
      </div>
      <div className="clock-date">
        {day}.{month}.{year}
      </div>
    </div>
  );
}

export default ClockWidget;

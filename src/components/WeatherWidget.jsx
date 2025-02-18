/* eslint-disable react-hooks/exhaustive-deps */
import React, { useState, useEffect } from 'react';
import './WeatherWidget.css';

function WeatherWidget({ theme }) {
  const [weather, setWeather] = useState(null);
  const [forecast, setForecast] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [cityInput, setCityInput] = useState('');
  const API_KEY = '4cc9911b0a2723050929b73c2a59e727';

  useEffect(() => {
    const storedCity = localStorage.getItem('weatherCity') || '';
    setCityInput(storedCity);

    if (!navigator.geolocation) {
      setLoading(false);
      if (storedCity) {
        fetchWeatherByCity(storedCity);
      }
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        fetchWeatherByCoords(latitude, longitude);
      },
      () => {
        setLoading(false);
        if (storedCity) {
          fetchWeatherByCity(storedCity);
        }
      }
    );
  }, []);

  const fetchWeatherByCoords = async (lat, lon) => {
    try {
      setLoading(true);
      const currentRes = await fetch(
        `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&units=metric&lang=ru&appid=${API_KEY}`
      );
      if (!currentRes.ok) throw new Error('Не удалось получить погоду');
      const currentData = await currentRes.json();
      setWeather({
        temp: Math.round(currentData.main.temp),
        description: currentData.weather[0].description,
        name: currentData.name,
      });

      const forecastRes = await fetch(
        `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&units=metric&lang=ru&appid=${API_KEY}`
      );
      if (!forecastRes.ok) throw new Error('Не удалось получить прогноз');
      const forecastData = await forecastRes.json();
      const processed = processForecastData(forecastData.list);
      setForecast(processed);
    } catch (err) {
      alert(err.message);
      setWeather(null);
      setForecast([]);
    }
    setLoading(false);
  };

  const fetchWeatherByCity = async (cityName) => {
    try {
      setLoading(true);
      const currentRes = await fetch(
        `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(
          cityName
        )}&units=metric&lang=ru&appid=${API_KEY}`
      );
      if (!currentRes.ok) throw new Error('Город не найден');
      const currentData = await currentRes.json();
      setWeather({
        temp: Math.round(currentData.main.temp),
        description: currentData.weather[0].description,
        name: currentData.name,
      });

      const forecastRes = await fetch(
        `https://api.openweathermap.org/data/2.5/forecast?q=${encodeURIComponent(
          cityName
        )}&units=metric&lang=ru&appid=${API_KEY}`
      );
      if (!forecastRes.ok) throw new Error('Не удалось получить прогноз');
      const forecastData = await forecastRes.json();
      const processed = processForecastData(forecastData.list);
      setForecast(processed);
    } catch (error) {
      alert(error.message);
      setWeather(null);
      setForecast([]);
    }
    setLoading(false);
  };

  const processForecastData = (list) => {
    const dayMap = {};
    list.forEach((item) => {
      const dateTxt = item.dt_txt.split(' ')[0];
      const temp = item.main.temp;
      if (!dayMap[dateTxt]) {
        dayMap[dateTxt] = { min: temp, max: temp };
      } else {
        if (temp < dayMap[dateTxt].min) dayMap[dateTxt].min = temp;
        if (temp > dayMap[dateTxt].max) dayMap[dateTxt].max = temp;
      }
    });

    const entries = Object.keys(dayMap).map((date) => ({
      date,
      min: Math.round(dayMap[date].min),
      max: Math.round(dayMap[date].max),
    }));
    entries.sort((a, b) => (a.date > b.date ? 1 : -1));

    return entries.slice(0, 4);
  };

  const handleWidgetClick = () => {
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
  };

  const handleCitySubmit = (e) => {
    e.preventDefault();
    if (cityInput.trim()) {
      localStorage.setItem('weatherCity', cityInput.trim());
      fetchWeatherByCity(cityInput.trim());
    }
  };

  return (
    <>
      <div className="weather-widget widget" onClick={handleWidgetClick}>
        {loading && <p>Загрузка погоды...</p>}

        {!loading && weather && (
          <>
            <div className="weather-city">{weather.name}</div>
            <div className="weather-temp">{weather.temp}°C</div>
            <div className="weather-desc">{weather.description}</div>
          </>
        )}

        {!loading && !weather && <p>Погода недоступна</p>}
      </div>

      {isModalOpen && (
        <div
          className={`weather-modal-overlay ${
            theme === 'dark' ? 'dark-overlay' : ''
          }`}
        >
          <div className="weather-modal-content">
            <button className="weather-modal-close" onClick={closeModal}>
              ×
            </button>
            <h2 className="weather-modal-title">ПОГОДА</h2>

            {weather && (
              <div className="weather-today">
                <div className="wt-city">{weather.name}</div>
                <div className="wt-temp">{weather.temp}°C</div>
                <div className="wt-desc">{weather.description}</div>
              </div>
            )}

            <form className="weather-city-form" onSubmit={handleCitySubmit}>
              <input
                type="text"
                placeholder="Введите город..."
                value={cityInput}
                onChange={(e) => setCityInput(e.target.value)}
              />
              <button type="submit">OK</button>
            </form>

            <hr />
            {forecast && forecast.length > 0 ? (
              <div className="weather-forecast">
                {forecast.map((day) => (
                  <div key={day.date} className="weather-forecast-day">
                    <div className="wf-dayName">
                      {new Date(day.date).toLocaleDateString('ru-RU', {
                        weekday: 'short',
                        day: 'numeric',
                        month: 'numeric',
                      })}
                    </div>
                    <div className="wf-temps">
                      <span className="wf-min">{day.min}°C</span> -{' '}
                      <span className="wf-max">{day.max}°C</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p>Нет данных по прогнозу</p>
            )}
          </div>
        </div>
      )}
    </>
  );
}

export default WeatherWidget;

/* eslint-disable react-hooks/exhaustive-deps */
import React, { useState, useEffect } from 'react';
import './WeatherWidget.css';
import {
  IoMdSunny,
  IoMdCloudy,
  IoMdRainy,
  IoMdSnow,
  IoMdThunderstorm,
  IoMdPartlySunny,
  IoMdMoon
} from 'react-icons/io';

/**
 * Возвращает иконку для погоды, исходя из описания (description).
 */
function getWeatherIcon(description) {
  if (!description) return IoMdPartlySunny;
  const lowerDesc = description.toLowerCase();

  if (lowerDesc.includes('clear')) {
    return IoMdSunny;
  }
  if (lowerDesc.includes('cloud')) {
    return IoMdCloudy;
  }
  if (lowerDesc.includes('rain') || lowerDesc.includes('drizzle')) {
    return IoMdRainy;
  }
  if (lowerDesc.includes('snow')) {
    return IoMdSnow;
  }
  if (lowerDesc.includes('thunder')) {
    return IoMdThunderstorm;
  }
  if (lowerDesc.includes('wind') || lowerDesc.includes('breeze')) {
    return IoMdPartlySunny; // или ваша иконка ветра
  }
  if (lowerDesc.includes('night') || lowerDesc.includes('moon')) {
    return IoMdMoon;
  }
  return IoMdPartlySunny;
}

function WeatherWidget({ theme }) {
  const [weather, setWeather] = useState(null);
  const [forecast, setForecast] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [cityInput, setCityInput] = useState('');
  const [canManualInput, setCanManualInput] = useState(false); 
  // Если за 5 секунд нет погоды — разрешаем ручной ввод

  const API_KEY = '4cc9911b0a2723050929b73c2a59e727'; // ваш реальный ключ

  useEffect(() => {
    const storedCity = localStorage.getItem('weatherCity') || '';
    setCityInput(storedCity);

    // Если уже есть city в localStorage, 
    // то НЕ пытаемся получать геолокацию, а сразу грузим погоду по городу
    if (storedCity) {
      fetchWeatherByCity(storedCity);
      return setLoading(false); // завершили загрузку
    }

    // Если города нет, пробуем геолокацию
    if (!navigator.geolocation) {
      // Нет geolocation => нет погоды
      setWeather(null);
      setLoading(false);
      return;
    }

    // Ставим таймер на 5с — если геолокация не отработала,
    // разрешаем ручной ввод
    const timerId = setTimeout(() => {
      if (loading && !weather) {
        setCanManualInput(true);
        setLoading(false);
      }
    }, 5000);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        clearTimeout(timerId);
        const { latitude, longitude } = position.coords;
        fetchWeatherByCoords(latitude, longitude);
      },
      (error) => {
        // Пользователь отклонил / ошибка — разрешаем ввод
        clearTimeout(timerId);
        setWeather(null);
        setLoading(false);
        setCanManualInput(true);
      }
    );

    return () => clearTimeout(timerId);
  }, []);

  const fetchWeatherByCoords = async (lat, lon) => {
    try {
      setLoading(true);
      const currentRes = await fetch(
        `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&units=metric&lang=ru&appid=${API_KEY}`
      );
      if (!currentRes.ok) throw new Error('Не удалось получить погоду (coords)');
      const currentData = await currentRes.json();
      setWeather({
        temp: Math.round(currentData.main.temp),
        description: currentData.weather[0].description,
        name: currentData.name
      });

      const forecastRes = await fetch(
        `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&units=metric&lang=ru&appid=${API_KEY}`
      );
      if (!forecastRes.ok) throw new Error('Не удалось получить прогноз (coords)');
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
      if (!currentRes.ok) throw new Error('Город не найден (by city)');
      const currentData = await currentRes.json();
      setWeather({
        temp: Math.round(currentData.main.temp),
        description: currentData.weather[0].description,
        name: currentData.name
      });

      const forecastRes = await fetch(
        `https://api.openweathermap.org/data/2.5/forecast?q=${encodeURIComponent(
          cityName
        )}&units=metric&lang=ru&appid=${API_KEY}`
      );
      if (!forecastRes.ok) throw new Error('Не удалось получить прогноз (by city)');
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
    // Если уже загрузили погоду, или прошло 5с (canManualInput), 
    // тогда можем открыть модалку
    if (weather || canManualInput) {
      setIsModalOpen(true);
    }
  };

  const closeModal = () => {
    setIsModalOpen(false);
  };

  const handleCitySubmit = (e) => {
    e.preventDefault();
    if (cityInput.trim()) {
      // Сохраняем город
      localStorage.setItem('weatherCity', cityInput.trim());
      fetchWeatherByCity(cityInput.trim());
    }
  };

  // Пока loading => показываем «Загрузка…»
  if (loading) {
    return (
      <div className="weather-widget mac-widget">
        <p>Загрузка погоды...</p>
      </div>
    );
  }

  // Если нет погоды (weather === null), 
  // проверяем canManualInput => пользователь может ввести город
  if (!weather) {
    return (
      <>
        <div className="weather-widget mac-widget" onClick={handleWidgetClick}>
          {canManualInput ? (
            <p>Нет данных. Нажмите, чтобы ввести город</p>
          ) : (
            <p>Погода недоступна</p>
          )}
        </div>
        {isModalOpen && (
          <div className={`weather-modal-overlay ${theme === 'dark' ? 'dark-overlay' : ''}`}>
            <div className="weather-modal-content mac-modal">
              <button className="weather-modal-close" onClick={closeModal}>
                ×
              </button>
              <h2 className="weather-modal-title">ПОГОДА</h2>
              <p>Введите город вручную:</p>
              <form className="weather-city-form" onSubmit={handleCitySubmit}>
                <input
                  type="text"
                  placeholder="Введите город..."
                  value={cityInput}
                  onChange={(e) => setCityInput(e.target.value)}
                />
                <button type="submit">OK</button>
              </form>
            </div>
          </div>
        )}
      </>
    );
  }

  // Иначе показываем погоду
  const WeatherIcon = getWeatherIcon(weather.description);

  return (
    <>
      <div className="weather-widget mac-widget" onClick={handleWidgetClick}>
        <div className="weather-icon">
          <WeatherIcon />
        </div>
        <div className="weather-info">
          <div className="weather-temp">{weather.temp} °C</div>
          <div className="weather-city-small">{weather.name}</div>
        </div>
      </div>

      {isModalOpen && (
        <div className={`weather-modal-overlay ${theme === 'dark' ? 'dark-overlay' : ''}`}>
          <div className="weather-modal-content mac-modal">
            <button className="weather-modal-close" onClick={closeModal}>
              ×
            </button>
            <h2 className="weather-modal-title">ПОГОДА</h2>

            <div className="weather-today">
              <div className="wt-icon">
                <WeatherIcon />
              </div>
              <div className="wt-temp">{weather.temp} °C</div>
              <div className="wt-city">{weather.name}</div>
              <div className="wt-desc">{weather.description}</div>
            </div>

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
                        month: 'numeric'
                      })}
                    </div>
                    <div className="wf-temps">
                      <span className="wf-min">{day.min}°C</span> - <span className="wf-max">{day.max}°C</span>
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

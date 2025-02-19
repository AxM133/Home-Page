import React, { useState } from 'react';
import './LinkForm.css';

function LinkForm({ onAddLink }) {
  const [title, setTitle] = useState('');
  const [url, setUrl] = useState('');
  const [iconBase64, setIconBase64] = useState('');
  const [category, setCategory] = useState('');

  const isValidUrl = (value) => {
    try {
      new URL(value);
      return true;
    } catch {
      return false;
    }
  };

  const fetchWithTimeout = (checkUrl, options, timeout = 3000) => {
    return Promise.race([
      fetch(checkUrl, options),
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error('timeout')), timeout)
      ),
    ]);
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) {
      setIconBase64('');
      return;
    }
    const reader = new FileReader();
    reader.onload = (evt) => {
      const base64Data = evt.target.result;
      setIconBase64(base64Data);
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (title.trim() === '' || url.trim() === '') return;
    if (!isValidUrl(url)) {
      alert('Пожалуйста, введите корректный URL, например, https://example.com');
      return;
    }
    try {
      await fetchWithTimeout(url, { method: 'HEAD', mode: 'no-cors' }, 3000);
      onAddLink({
        title,
        url,
        customIcon: iconBase64 || '',
        category: category.trim(),
        createdAt: Date.now(),
      });
      setTitle('');
      setUrl('');
      setIconBase64('');
      setCategory('');
      e.target.reset();
    } catch {
      alert('Сайт не найден или недоступен');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="link-form">
      <input
        type="text"
        placeholder="Название ссылки"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        required
      />

      <input
        type="url"
        placeholder="URL сайта (например, https://example.com)"
        value={url}
        onChange={(e) => setUrl(e.target.value)}
        required
      />

      <input type="file" accept="image/*" onChange={handleFileChange} />

      <input
        type="text"
        placeholder="Категория (например, Работа, Игры)"
        value={category}
        onChange={(e) => setCategory(e.target.value)}
      />

      <button type="submit">Добавить ссылку</button>
    </form>
  );
}

export default LinkForm;

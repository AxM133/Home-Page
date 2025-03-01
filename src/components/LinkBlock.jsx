import React, { useState, useEffect } from 'react';
import './LinkBlock.css';
import defaultIcon from '../assets/default-icon.png';

function LinkBlock({
  title,
  url,
  customIcon = '',
  isRemoveMode,
  onRemove,
  onEdit,
}) {
  let domain = '';
  try {
    domain = new URL(url).hostname;
  } catch {}

  const googleIconUrl = `https://www.google.com/s2/favicons?domain=${domain}&sz=128`;
  const [iconSrc, setIconSrc] = useState(customIcon || googleIconUrl);

  useEffect(() => {
    if (customIcon) {
      setIconSrc(customIcon);
    } else {
      setIconSrc(googleIconUrl);
    }
  }, [customIcon, googleIconUrl]);

  const handleImgError = () => {
    setIconSrc(defaultIcon);
  };

  return (
    <div className="link-block-wrapper">
      <a
        href={url}
        className="link-block"
        target="_blank"
        rel="noopener noreferrer"
      >
        <div className="icon-wrapper">
          <img
            src={iconSrc}
            alt="icon"
            className="favicon"
            onError={handleImgError}
          />
        </div>
        {/* Всплывающий текст над блоком при hover */}
        <div className="tooltip">{title}</div>
      </a>

      {isRemoveMode && (
        <>
          {/* Предположим, что мы хотим удалить слева, редактировать справа */}
          <button className="remove-block-btn" onClick={onRemove}>
            -
          </button>
          <button className="edit-block-btn" onClick={onEdit}>
            ✎
          </button>
        </>
      )}
    </div>
  );
}

export default LinkBlock;

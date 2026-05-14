// script.js
// Оптимизированная JavaScript анимация для iOS Safari
// Обновлено: исправлена бесконечная навигация для всех устройств

// Debug-логи: включить через ?debug=1 в URL или localStorage.debug = '1'
const DEBUG = (() => {
  try {
    const params = new URLSearchParams(window.location.search);
    return params.get('debug') === '1' || localStorage.getItem('debug') === '1';
  } catch (e) { return false; }
})();
const log = DEBUG ? console.log.bind(console) : () => {};
const warn = DEBUG ? console.warn.bind(console) : () => {};
const errorLog = console.error.bind(console); // ошибки всегда логируем

if (DEBUG) {
  log('🚀 Script loaded successfully!');
  log('📱 iOS Safari optimized animation');
  log('🔄 Infinite navigation enabled for all devices');
}

// Элементы
const stripTrack = document.querySelector('.strip-track');
let animationId = null;
let position = 0;
const speed = 0.35; // уменьшено на 30%
let isRunning = false;
let isPaused = false;

// Переменные для свайпа
let isDragging = false;
let startX = 0;
let startPosition = 0;
let lastTouchTime = 0;

// Глобальные переменные состояния для галереи
let shuffledPhotoOrder = [];
let currentPhotoIndex = 0;

// Функция перемешивания массива (алгоритм Fisher-Yates)
function shuffleArray(array) {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

// === Dynamic photos via manifest (override) ===
let photosManifest = [];

async function loadPhotosManifest() {
  try {
    const res = await fetch('assets/photos.json');
    photosManifest = await res.json();
    log('📁 photos.json loaded:', photosManifest.length);
  } catch (e) {
    errorLog('Failed to load photos.json', e);
    photosManifest = [];
  }
}

// Помощник: дождаться загрузки первых превью и стартовать анимацию
function startAfterImagesReady() {
  const imgs = Array.from(stripTrack.querySelectorAll('img'));
  if (imgs.length === 0) return;
  const sample = imgs.slice(0, Math.min(5, imgs.length));
  const waiters = sample.map(img => img.complete ? Promise.resolve() : new Promise(res => {
    img.addEventListener('load', res, { once: true });
    img.addEventListener('error', res, { once: true });
  }));
  Promise.race(waiters).then(() => {
    position = 0;
    stripTrack.style.transform = 'translateX(0px)';
    if (isRunning) {
      isRunning = false;
      cancelAnimationFrame(animationId);
    }
    startAnimation();
  });
}

function buildStripFromShuffled() {
  if (!Array.isArray(shuffledPhotoOrder) || shuffledPhotoOrder.length === 0) return;
  const uniqueCount = shuffledPhotoOrder.length;
  const duplicated = [...shuffledPhotoOrder, ...shuffledPhotoOrder];

  // Clear and build
  stripTrack.innerHTML = '';
  duplicated.forEach((photo, i) => {
    const img = document.createElement('img');
    img.src = photo.thumb;
    img.alt = photo.id || `Photo ${i + 1}`;
    img.dataset.idx = String(i % uniqueCount);
    img.classList.add('fade-in');
    img.loading = i < 4 ? 'eager' : 'lazy';   // первые 4 — eager, остальные lazy
    if (i === 0) img.fetchPriority = 'high';  // LCP hint для первого превью

    // Fade-in после загрузки thumb
    if (img.complete && img.naturalWidth > 0) {
      img.classList.add('is-visible');
    } else {
      img.addEventListener('load', () => img.classList.add('is-visible'), { once: true });
      img.addEventListener('error', () => img.classList.add('is-visible'), { once: true });
    }

    img.addEventListener('click', () => {
      if (isDragging) return;
      currentPhotoIndex = Number(img.dataset.idx);
      showPhoto(currentPhotoIndex);
    });

    stripTrack.appendChild(img);
  });

  // После построения ждём загрузку первых превью и только потом стартуем анимацию
  startAfterImagesReady();
}

// Override shufflePhotos to use manifest
function shufflePhotos() {
  if (!photosManifest || photosManifest.length === 0) {
    warn('No manifest yet, skipping shuffle');
    return;
  }
  shuffledPhotoOrder = shuffleArray(photosManifest);
  buildStripFromShuffled();
  log('🔀 Shuffled', shuffledPhotoOrder.length, 'photos, trackWidth:', stripTrack.scrollWidth);
}

// Override showPhoto to use full images from manifest
function showPhoto(index) {
  if (!shuffledPhotoOrder || shuffledPhotoOrder.length === 0) return;
  const max = shuffledPhotoOrder.length;
  
  log('🔄 showPhoto called with index:', index, 'max:', max);
  
  // Бесконечная навигация: зацикливаем индексы
  if (index < 0) {
    index = max - 1; // Переходим к последнему фото
    log('🔄 Index < 0, cycling to last photo:', index);
  } else if (index >= max) {
    index = 0; // Переходим к первому фото
    log('🔄 Index >= max, cycling to first photo:', index);
  }
  
  currentPhotoIndex = index;
  const photo = shuffledPhotoOrder[index];
  if (!photo) return;
  
  log('🔄 Showing photo:', photo.id || `Photo ${index + 1}`);
  
  photoModalImg.src = photo.full;
  photoModal.classList.add('active');
  updateNavigationButtons();
  showNavigationButtons();
}

// Init manifest flow
(async () => {
  await loadPhotosManifest();
  if (photosManifest.length > 0) {
    shufflePhotos();
  }
})();

// Фолбэк если лента не построилась
function ensureStripPopulated() {
  setTimeout(async () => {
    if (!stripTrack) return;
    if (stripTrack.children.length === 0) {
      warn('⚠️ Strip is empty, retrying manifest load...');
      if (!photosManifest || photosManifest.length === 0) {
        await loadPhotosManifest();
      }
      if (photosManifest && photosManifest.length > 0) {
        shuffledPhotoOrder = shuffleArray(photosManifest);
        buildStripFromShuffled();
      }
    }
  }, 800);
}

document.addEventListener('DOMContentLoaded', () => {
  ensureStripPopulated();
});

// Определяем iOS для специальной обработки (включая Chrome на iOS)
const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) || 
              (navigator.userAgent.includes('Mac') && 'ontouchend' in document);
const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
const isChromeiOS = navigator.userAgent.includes('CriOS');
const isSafariiOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !navigator.userAgent.includes('CriOS');

log('🍎 iOS detected:', isIOS);
log('📱 Mobile detected:', isMobile);
log('🌐 Chrome iOS:', isChromeiOS);
log('🧭 Safari iOS:', isSafariiOS);

// Детальная диагностика размеров экрана
function logScreenDiagnostics() {
  const diagnostics = {
    // Размеры экрана
    screenWidth: screen.width,
    screenHeight: screen.height,
    screenAvailWidth: screen.availWidth,
    screenAvailHeight: screen.availHeight,
    
    // Размеры окна
    windowInnerWidth: window.innerWidth,
    windowInnerHeight: window.innerHeight,
    windowOuterWidth: window.outerWidth,
    windowOuterHeight: window.outerHeight,
    
    // VisualViewport (если доступен)
    visualViewportWidth: window.visualViewport ? window.visualViewport.width : 'не доступен',
    visualViewportHeight: window.visualViewport ? window.visualViewport.height : 'не доступен',
    
    // Ориентация
    orientation: window.orientation || 'не доступен',
    orientationAngle: screen.orientation ? screen.orientation.angle : 'не доступен',
    
    // Device Pixel Ratio
    devicePixelRatio: window.devicePixelRatio,
    
    // User Agent
    userAgent: navigator.userAgent,
    
    // CSS размеры
    documentElementWidth: document.documentElement.clientWidth,
    documentElementHeight: document.documentElement.clientHeight,
    
    // Body размеры
    bodyWidth: document.body ? document.body.clientWidth : 'не загружен',
    bodyHeight: document.body ? document.body.clientHeight : 'не загружен'
  };
  
  log('📊 === ДИАГНОСТИКА РАЗМЕРОВ ЭКРАНА ===');
  log(diagnostics);
  
  // Дополнительные проверки для мобильных
  if (isMobile || isIOS) {
    log('📱 === МОБИЛЬНАЯ ДИАГНОСТИКА ===');
    log('🔄 Ориентация:', Math.abs(window.orientation) === 90 ? 'Landscape' : 'Portrait');
    log('📐 Соотношение сторон:', (window.innerWidth / window.innerHeight).toFixed(2));
    
    // Проверяем какие медиа-запросы срабатывают
    const mediaQueries = [
      'screen and (orientation: landscape)',
      'screen and (orientation: portrait)', 
      'screen and (max-height: 500px)',
      'screen and (max-height: 428px)',
      'screen and (max-height: 375px)',
      'screen and (max-width: 926px)',
      'screen and (orientation: landscape) and (max-height: 500px)'
    ];
    
    log('🎯 === МЕДИА-ЗАПРОСЫ ===');
    mediaQueries.forEach(query => {
      const matches = window.matchMedia(query).matches;
      log(`${matches ? '✅' : '❌'} ${query}`);
    });
  }
}

// Запускаем диагностику (только в debug-режиме)
if (DEBUG) logScreenDiagnostics();

// Простая JavaScript анимация
function animate() {
  if (!isRunning || isPaused || isDragging) return;

  position -= speed;

  const singleWidth = stripTrack.scrollWidth / 2; // ширина одной половины (оригинал + дубли)
  if (position <= -singleWidth) {
    position += singleWidth; // плавный перенос без рывка
  }

  stripTrack.style.transform = `translate3d(${position}px, 0, 0)`;
  animationId = requestAnimationFrame(animate);
}

function startAnimation() {
  if (isRunning) return;
  isRunning = true;
  isPaused = false;
  log('▶️ Animation started');
  animate();
}

function pauseAnimation() {
  isPaused = true;
  log('⏸️ Animation paused');
}

function resumeAnimation() {
  if (!isRunning) return;
  isPaused = false;
  log('▶️ Animation resumed');
  animate();
}

// Touch события с оптимизацией для iOS
stripTrack.addEventListener('touchstart', (e) => {
  log('🖐️ Touch start');
  isDragging = true;
  startX = e.touches[0].clientX;
  startPosition = position;
  lastTouchTime = Date.now();
  pauseAnimation();
}, { passive: false }); // passive: false для работы preventDefault на iOS

stripTrack.addEventListener('touchmove', (e) => {
  if (!isDragging) return;
  
  const currentTime = Date.now();
  const timeDelta = currentTime - lastTouchTime;
  
  // Ограничиваем частоту обновлений для iOS (60fps максимум)
  if (timeDelta < 16) return;
  
  // Предотвращаем прокрутку страницы только для горизонтальных движений
  const currentX = e.touches[0].clientX;
  const deltaX = currentX - startX;
  const absDeltaX = Math.abs(deltaX);
  
  // Если горизонтальное движение больше вертикального, блокируем прокрутку
  if (absDeltaX > 10) {
    e.preventDefault();
  }
  
  // Обновляем позицию
  position = startPosition + deltaX;
  
  // Используем CSS transform вместо прямого изменения style для лучшей производительности
  stripTrack.style.transform = `translateX(${position}px)`;
  
  lastTouchTime = currentTime;
  log('👆 Touch move:', Math.round(deltaX));
}, { passive: false });

stripTrack.addEventListener('touchend', (e) => {
  log('👋 Touch end');
  isDragging = false;
  
  // Нормализуем позицию после свайпа
  const trackWidth = stripTrack.scrollWidth / 2;
  if (position >= trackWidth) {
    position -= trackWidth;
  } else if (position <= -trackWidth) {
    position += trackWidth;
  }
  
  // Для iOS используем меньшую задержку
  const resumeDelay = isIOS ? 100 : 200;
  setTimeout(() => {
    resumeAnimation();
  }, resumeDelay);
}, { passive: false });

// Дополнительная обработка для предотвращения случайных scrolls на iOS
if (isIOS) {
  document.addEventListener('touchmove', (e) => {
    // Предотвращаем прокрутку только если touch происходит в области ленты
    if (e.target.closest('.strip-track')) {
      e.preventDefault();
    }
  }, { passive: false });
}

// Бургер-меню
const burger = document.getElementById('burger-menu');
const mobileMenu = document.getElementById('mobile-menu');

if (burger && mobileMenu) {
  burger.addEventListener('click', () => {
    log('🍔 Burger menu clicked');
    mobileMenu.classList.toggle('active');
  });
  mobileMenu.querySelectorAll('a').forEach(link => {
    link.addEventListener('click', () => {
      log('🔗 Mobile menu link clicked:', link.textContent);
      mobileMenu.classList.remove('active');
    });
  });
}

const closeMenuBtn = document.getElementById('close-menu');
if (closeMenuBtn && mobileMenu) {
  closeMenuBtn.addEventListener('click', () => {
    log('❌ Close menu clicked');
    mobileMenu.classList.remove('active');
  });
}

// Модальное окно для просмотра фото
const photoModal = document.getElementById('photo-modal');
const photoModalImg = document.getElementById('photo-modal-img');
const photoModalClose = document.getElementById('photo-modal-close');
const photoModalPrev = document.getElementById('photo-modal-prev');
const photoModalNext = document.getElementById('photo-modal-next');

// Логируем состояние элементов модалки
log('🔍 Modal elements check:');
log('  photoModal:', photoModal ? '✅ Found' : '❌ Not found');
log('  photoModalImg:', photoModalImg ? '✅ Found' : '❌ Not found');
log('  photoModalClose:', photoModalClose ? '✅ Found' : '❌ Not found');
log('  photoModalPrev:', photoModalPrev ? '✅ Found' : '❌ Not found');
log('  photoModalNext:', photoModalNext ? '✅ Found' : '❌ Not found');

// Переменные для навигации
let navigationTimeout = null;

// Убираем дублирующий код - теперь модалка открывается только через showPhoto()
// с правильной логикой бесконечной навигации

// Функция обновления состояния кнопок навигации
function updateNavigationButtons() {
  // При бесконечной навигации стрелки всегда видны
  if (photoModalPrev) photoModalPrev.style.display = 'flex';
  if (photoModalNext) photoModalNext.style.display = 'flex';
  // Запускаем таймер автоскрытия через 2 секунды
  startNavigationTimer();
}

// Функция запуска таймера автоскрытия стрелок
function startNavigationTimer() {
  if (navigationTimeout) {
    clearTimeout(navigationTimeout);
  }
  navigationTimeout = setTimeout(() => {
    hideNavigationButtons();
  }, 2000);
}

function hideNavigationButtons() {
  if (photoModalPrev) photoModalPrev.style.opacity = '0';
  if (photoModalNext) photoModalNext.style.opacity = '0';
}

function showNavigationButtons() {
  if (photoModalPrev) photoModalPrev.style.opacity = '1';
  if (photoModalNext) photoModalNext.style.opacity = '1';
  startNavigationTimer();
}

// Обработчики кнопок навигации модалки
if (photoModalPrev) {
  photoModalPrev.addEventListener('click', (e) => {
    e.stopPropagation();
    log('🔄 Prev button clicked, current index:', currentPhotoIndex);
    // Бесконечная навигация: всегда можно перейти к предыдущему
    showPhoto(currentPhotoIndex - 1);
  });
} else {
  warn('⚠️ photoModalPrev element not found');
}

if (photoModalNext) {
  photoModalNext.addEventListener('click', (e) => {
    e.stopPropagation();
    log('🔄 Next button clicked, current index:', currentPhotoIndex);
    // Бесконечная навигация: всегда можно перейти к следующему
    showPhoto(currentPhotoIndex + 1);
  });
} else {
  warn('⚠️ photoModalNext element not found');
}

// Закрытие модалки
function closePhotoModal() {
  photoModal.classList.remove('active');
  photoModalImg.src = '';
  clearTimeout(navigationTimeout);
}

if (photoModalClose) {
  photoModalClose.addEventListener('click', (e) => {
    e.stopPropagation();
    closePhotoModal();
  });
} else {
  warn('⚠️ photoModalClose element not found');
}

// Надёжное закрытие модалки на мобильных: обрабатываем touch/pointer
const handleModalCloseTap = (e) => {
  e.preventDefault();
  e.stopPropagation();
  closePhotoModal();
};

if (photoModalClose) {
  photoModalClose.addEventListener('touchend', handleModalCloseTap, { passive: false });
  photoModalClose.addEventListener('pointerup', handleModalCloseTap, { passive: false });
}

if (photoModal) {
  photoModal.addEventListener('click', (e) => {
    if (e.target === photoModal) {
      closePhotoModal();
    }
  });
} else {
  warn('⚠️ photoModal element not found');
}

document.addEventListener('keydown', (e) => {
  if (!photoModal.classList.contains('active')) return;
  if (e.key === 'Escape') {
    e.preventDefault();
    closePhotoModal();
  } else if (e.key === 'ArrowLeft') {
    e.preventDefault();
    // Бесконечная навигация: всегда можно перейти к предыдущему
    showPhoto(currentPhotoIndex - 1);
  } else if (e.key === 'ArrowRight') {
    e.preventDefault();
    // Бесконечная навигация: всегда можно перейти к следующему
    showPhoto(currentPhotoIndex + 1);
  }
});

// Swipe навигация в модалке
let modalTouchStartX = 0;
let modalTouchStartY = 0;

if (photoModal) {
  photoModal.addEventListener('touchstart', (e) => {
    if (!photoModal.classList.contains('active')) return;
    // игнорируем жесты, начатые на крестике, чтобы один тап всегда закрывал
    if (e.target && e.target.closest && e.target.closest('#photo-modal-close')) {
      e.stopPropagation();
      return;
    }
    modalTouchStartX = e.touches[0].clientX;
    modalTouchStartY = e.touches[0].clientY;
    showNavigationButtons();
  });

  photoModal.addEventListener('touchend', (e) => {
    if (!photoModal.classList.contains('active')) return;
    if (e.target && e.target.closest && e.target.closest('#photo-modal-close')) {
      e.stopPropagation();
      return;
    }
    const endX = e.changedTouches[0].clientX;
    const endY = e.changedTouches[0].clientY;
    const dx = endX - modalTouchStartX;
    const dy = endY - modalTouchStartY;
    if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > 50) {
      // Бесконечная навигация: всегда можно свайпнуть в любом направлении
      if (dx < 0) {
        showPhoto(currentPhotoIndex + 1); // Свайп влево = следующее фото
      } else if (dx > 0) {
        showPhoto(currentPhotoIndex - 1); // Свайп вправо = предыдущее фото
      }
    }
  });
}

// Перестроим клик по превью на делегирование и корректный индекс
stripTrack.addEventListener('click', (e) => {
  const img = e.target.closest('img');
  if (!img || isDragging) return;
  const idx = Number(img.dataset.idx);
  if (!Number.isFinite(idx)) return;
  showPhoto(idx);
});
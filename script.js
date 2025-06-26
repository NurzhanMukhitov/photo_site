// script.js
// Здесь будет логика для управления лентой или интерактивом 

const stripTrack = document.querySelector('.strip-track');
const images = stripTrack.querySelectorAll('img');
let animationId;
let pos = 0;
const speed = 0.325; // скорость прокрутки (ещё в 2 раза медленнее)
let isRunning = false;

function animate() {
  isRunning = true;
  pos -= speed;
  // ширина половины ленты (т.к. изображения дублируются)
  const trackWidth = stripTrack.scrollWidth / 2;
  if (Math.abs(pos) >= trackWidth) {
    pos = 0;
  }
  stripTrack.style.transform = `translateX(${pos}px)`;
  animationId = requestAnimationFrame(animate);
}

// Бургер-меню
const burger = document.getElementById('burger-menu');
const mobileMenu = document.getElementById('mobile-menu');

if (burger && mobileMenu) {
  burger.addEventListener('click', () => {
    mobileMenu.classList.toggle('active');
  });
  mobileMenu.querySelectorAll('a').forEach(link => {
    link.addEventListener('click', () => {
      mobileMenu.classList.remove('active');
    });
  });
}

const closeMenuBtn = document.getElementById('close-menu');
if (closeMenuBtn && mobileMenu) {
  closeMenuBtn.addEventListener('click', () => {
    mobileMenu.classList.remove('active');
  });
}

animate();

// --- Модальное окно для просмотра фото ---
const photoModal = document.getElementById('photo-modal');
const photoModalImg = document.getElementById('photo-modal-img');
const photoModalClose = document.getElementById('photo-modal-close');

// Открытие модального окна по клику на фото
const stripImages = document.querySelectorAll('.strip-track img');
stripImages.forEach(img => {
  img.addEventListener('click', (e) => {
    photoModalImg.src = img.src;
    photoModal.classList.add('active');
  });
});

// Закрытие по крестику
photoModalClose.addEventListener('click', () => {
  photoModal.classList.remove('active');
  photoModalImg.src = '';
});
// Закрытие по клику вне фото
photoModal.addEventListener('click', (e) => {
  if (e.target === photoModal) {
    photoModal.classList.remove('active');
    photoModalImg.src = '';
  }
}); 
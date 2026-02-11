// Lightweight burger menu script for pages without main app script
document.addEventListener('DOMContentLoaded', function () {
  var burger = document.getElementById('burger-menu');
  var mobileMenu = document.getElementById('mobile-menu');
  var closeBtn = document.getElementById('close-menu');

  if (burger && mobileMenu) {
    burger.addEventListener('click', function () {
      mobileMenu.classList.toggle('active');
    });
  }

  if (closeBtn && mobileMenu) {
    closeBtn.addEventListener('click', function () {
      mobileMenu.classList.remove('active');
    });
  }

  if (mobileMenu) {
    var links = mobileMenu.querySelectorAll('a');
    links.forEach(function (link) {
      link.addEventListener('click', function () {
        mobileMenu.classList.remove('active');
      });
    });
  }
});



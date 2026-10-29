(() => {
  const canvas = document.querySelector('.canvas-scroll');
  const shadow = document.querySelector('.scroll-shadow');
  function updateShadow() {
    shadow.hidden = canvas.scrollTop <= 0;
  }
  canvas.addEventListener('scroll', updateShadow, { passive: true });
  updateShadow();
})();

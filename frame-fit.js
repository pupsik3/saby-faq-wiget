(() => {
  const wrapper = document.querySelector('.frame-fit');
  function fitFrame() {
    const frame=wrapper.querySelector('.prototype-shell')||wrapper.querySelector('.editor'),width=frame.classList.contains('prototype-shell')?1900:1600;
    if(width===1900)for(const editor of frame.querySelectorAll('.editor'))editor.style.transform='';
    const scale = Math.min(
      document.documentElement.clientWidth / width,
      document.documentElement.clientHeight / 900
    );
    wrapper.style.width = `${width * scale}px`;
    wrapper.style.height = `${900 * scale}px`;
    frame.style.transform = `scale(${scale})`;
  }
  fitFrame();
  window.addEventListener('resize', fitFrame);
  window.addEventListener('prototype:layout',fitFrame);
})();

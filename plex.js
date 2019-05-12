(function screenshotModule() {
  /**
   * @param {HTMLElement}
   * @return {boolean} Is the Html element visible?
   */
  const visible = (domElement) => getComputedStyle(domElement).display !== 'none';
  /**
   * @return {boolean} Is the user currently editing text?
   */
  const editingText = () => !!document.querySelector('input.textbox');
  
  const body = document.body;
  const canvas = document.getElementById('canvas');
  if (!canvas) {
    return;
  }
  const hist = document.getElementById('annotation-history');
  const img = document.getElementById('screenshot_image');
  const promo = document.getElementById('promo');
  const title = document.getElementById('title');
  const toolbox = document.getElementById('toolbox');
  const deleteLink = document.getElementById('delete-link');

  const optionsText = [
    'Hotkeys:',
    'Hold Space to use Rectangle Tool',
    'Release Space to use Arrow Tool',
    'Press Backspace or Ctrl-Z to undo the last draw action',
    'Press Ctrl-Delete or Ctrl-Alt-Backspace to delete the current screenshot',
  ];
  
  const angle = Math.floor(Math.random() * 80);
  
  body.style.backgroundColor = '#eee';
  canvas.style.filter = [
    'drop-shadow(-2px 2px 1px white)',
    'drop-shadow(2px 2px 1px black)',
    `hue-rotate(-${angle}deg)`,
  ].join(' ');
  canvas.style.padding = '0 10em 0 0';
  hist.style.opacity = '0.5';
  img.style.filter = 'saturate(80%)';
  promo.style.visibility = 'hidden';
  title.style.backgroundColor = '#eee';
  toolbox.style.opacity = '0.5';
  
  window.scrollTo({top: 30, left: 50});
  
  if (!visible(toolbox)) {
    return;
  }
  function toggleTool() {
    switchTool = false;
    if (toolbox.children[0].className === '') {
      toolbox.children[0].click();
    } else {
      toolbox.children[3].click();
    }
  }
  let switchTool = false;
  let mouseDown = false;
  document.addEventListener('mousedown', (e) => mouseDown = true);
  document.addEventListener('mouseup', (e) => {
    mouseDown = false;
    if (switchTool) {
      toggleTool();
    }
  });
  document.addEventListener('keydown', (e) => {
    if (e.code === 'Space' && !editingText()) {
      e.preventDefault();
      if (mouseDown) {
        switchTool = true;
        return;
      }
      toolbox.children[3].click();
    }
    const ctrlZ = e.ctrlKey && e.code === 'KeyZ';
    const backspace = e.code === 'Backspace';
    if ((ctrlZ || backspace) && !editingText()) {
      try {
        hist.lastElementChild.lastElementChild.firstElementChild.click();
      } catch (e) {
        if (!(e instanceof TypeError)) {
          throw e;
        }
      }
    }
    if (e.ctrlKey && e.code === 'Delete') {
      if (confirm('Would you like to delete this screenshot?')) {
        deleteLink.click();
      }
    }
    if (e.ctrlKey && e.code === 'Slash') {
      alert(optionsText);
    }
  });
  document.addEventListener('keyup', (e) => {
    if (mouseDown) {
      switchTool = true;
      return;
    }
    toolbox.children[0].click();
  });
  console.log('%c' + optionsText.join('\n'), 'color: indigo; font-weight: bold');
})();
{
  let key;
  let count = 0;
  const map = {
    KeyE: ['é', 'ë', 'è'],
    KeyI: ['í', 'ï', 'ì'],
  }
  document.addEventListener('keydown', (e) => {
    if (key === e.code) {
      count++;
      e.preventDefault();
      const letters = map[key];
      if (count > 1 || !letters || !letters.length) {
        return;
      }
      const hide = show(letters);
      setOnceListeners(letters, hide);
    }
    if (!e.code.includes('Key')) {
      return;
    }
    key = e.code;
  });
  document.addEventListener('keyup', () => {
    key = null;
    count = 0;
  });
  function show(letters) {
    const box = document.activeElement.getBoundingClientRect();
    const div = document.createElement('div');
    div.style.backgroundColor = 'white';
    div.style.border = 'solid #bbb';
    div.style.borderWidth = 'thin';
    div.style.padding = '5px';
    div.style.borderRadius = '8px';
    div.style.fontSize = '20px';
    div.style.left = Math.floor(box.left) + 'px';
    div.style.position = 'fixed';
    div.style.top = Math.floor(box.top - 30) + 'px';
    div.style.zIndex = 2004;
    div.textContent = letters.join(' ');
    document.body.append(div);
    return () => div.remove();
  }
  function setOnceListeners(letters, hide) {
    document.addEventListener('keyup', (e) => {
      document.addEventListener('keydown', (e) => {
        e.preventDefault();
        hide && hide();
        const idx = -1 + Number(e.code.slice(-1));
        if (isNaN(Number(idx))) {
          return;
        }
        const newLetter = letters[idx];
        newLetter && replaceLastChar(newLetter);
      }, {once: true});
    }, {once: true});
  }
  function replaceLastChar(newChar) {
    console.log(newChar);
    const value = document.activeElement.value;
    const start = document.activeElement.selectionStart;
    document.activeElement.value =
      value.slice(0, start - 1) + newChar + value.slice(start);
    document.activeElement.selectionStart = start;
    document.activeElement.selectionEnd = start;
  }
}
undefined
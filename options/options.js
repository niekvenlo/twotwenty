function wait(ms = DEFAULT_DELAY) {
  return new Promise((resolve) => setTimeout(() => resolve(), ms));
}

window.onload = function() {
  
  /**
   * Show a quick popup message that quickly disappears.
   *
   * @param {string} msg - The text of the message
   */
  const toast = (function() {
    const toast = document.createElement('div');
    toast.style.backgroundColor = 'black';
    toast.style.bottom = '60px';
    toast.style.boxShadow = '0 0.2em 0.5em #aaa';
    toast.style.color = 'white';
    toast.style.padding = '0.8em 1.2em';
    toast.style.position = 'fixed';
    toast.style.right = '60px';
    toast.style.zIndex = '2001';
    toast.hidden = true;
    document.body.append(toast);
    let ts;
    return function(msg) {
      toast.hidden = false;
      toast.textContent = msg;
      clearTimeout(ts);
      ts = setTimeout(() => {
        toast.textContent = '';
        toast.hidden = true;
      }, 1000);
    };
  })();
  
  /**
   * Store data in chrome.storage.local.
   *
   * @param {Object} stores - Map of JSON strings to store as objects.
   */
  function set(stores) {
    for (let store in stores) {
      if (typeof stores[store] !== 'object') {
        throw new Error(`Trying to set ${store} with ${typeof stores[store]}`);
      }
      console.debug(store, stores[store]);
      chrome.storage.local.set({[store]: stores[store]});
    }
  }

  var create = (type, params, style) => {
    const el = document.createElement(type);
    for (let param in params) {
      el[param] = params[param];
    }
    for (let rule in style) {
      el.style[rule] = style[rule];
    }
    return el;
  }
  
  function makeConfigEditor(array) {
    const contain = create('div');
    const title =
        create('div', {className: 'title', textContent: 'Configuration'});
    const fields = create('div', {className: 'fields'}, {
      display: 'grid',
      gridTemplateColumns: '1fr 1fr',
    });
    contain.appendChild(title);
    contain.appendChild(fields);
    for (let field of array) {
      const key = create('div', {
        innerText: field.name,
        title: field.description || '...',
      });
      const value = (typeof field.value === 'boolean')
          ? create('input', {
            spellcheck: false,
            type: 'checkbox',
            checked: field.value,
          })
          : create('input', {
            spellcheck: false,
            type: 'text',
            value: field.value,
          });
      value.addEventListener('change', ({target}) => {
        if (field.value === target.value) {
          return;
        }
        if (target.type === 'checkbox') {
          field.value = target.checked;
        } else {
          field.value = target.value;
        }
        set({'Configuration': array});
        toast(`Change saved`);
      });
      fields.appendChild(key);
      fields.appendChild(value);
    }
    document.getElementById('main').append(contain);
  }

  var defaultStores = {
    Configuration: [
      {
        name: 'initials',
        value: '',
        description:
            'Your initials will be automatically added to the comment box.',
      },
      {
        name: 'play beeps on error',
        value: true,
        description:
            'Play a beep for high and medium level warnings. ' +
            '\nBeep repeats every couple of seconds.',
      },
      {
        name: 'use escape-key to approve',
        value: false,
        description:
            'Use the Escape key as a Hotkey to Approve tasks.' +
            '\nRecommended for the Japanese team.',
      },
      {
        name: 'keep original capitalisation',
        value: false,
        description:
            'Stops automatic capitalization changes when pasting text.' +
            '\nRecommended for the Japanese team.',
      },
      {
        name: 'keep tabs open until submitting',
        value: false,
        description:
            'Normally, all tabs are closed when you Approve.\nNow, tabs ' +
            'will close when you Submit, instead',
      },
      {
        name: 'more obvious bubbles',
        value: false,
        description:
            'Use less transparent error bubbles.',
      },
      {
        name: 'use dual monitor mode',
        value: false,
        description:
            'Leave one tab open so you can move it to a new window.' +
            '\nNew tabs open with the open tab.',
      },
      {
        name: 'use google links',
        value: false,
        description:
            'Experimental: Use the Google internal redirection system.',
      },
      {
        name: 'snippets: keep creative in view',
        value: false,
        description:
            'Experimental: Fixes the creative at the top of the page.',
      },
    ],
    BrandCapitalisation: [
      "AdWords",
      "iPhone",
      "iPad",
      "iPod",
      "iMac",
      "iBook",
      "iTunes",
      "MacBook",
      "YouTube",
    ],
    ForbiddenPhrases: [
      ["/[,.]/","Commas and periods are not allowed"],
      ["/[:;]/","Colons and semicolons are not allowed"],
      ["/[!?]/","Exclamation marks and question marks are not allowed"],
      ["/[\\(\\)\\[\\]\\{\\}\\<\\>]/","Brackets are not allowed"],
      ["/[@#$^*–~‘’]/","Special characters are not allowed"],
      ["/^ /","A space at the front is not allowed"],
      ["/  /","Double spaces are not allowed"],
      ["/\\n/","Line breaks are not allowed"],
      ["/\\s&\\w|\\w&\\s/","Use spaces on both sides of the &"],
      ["/\\s/\\w|\\w/\\s/","Use spaces on both sides of the /"],
    ],
  };

  chrome.storage.local.get(null, (stores) => {
    var allStores = {...defaultStores, ...stores};
    const copy = defaultStores['Configuration'].slice();
    allStores['Configuration'] = copy.map(defaultSetting => {
      const storedSetting = allStores['Configuration']
          .find(a => a.name === defaultSetting.name);
      const copy = {...defaultSetting};
      copy.value = (storedSetting) ? storedSetting.value : copy.value;
      return copy;
    });
    set(allStores);
    console.log(allStores);
    makeConfigEditor(allStores['Configuration']);
  });
  
  const feedback = document.createElement('button');
  feedback.textContent = 'Feature request?';
  feedback.title =
      'Any feedback is welcome.' +
      '\nQuestions, comments, concerns';
  feedback.addEventListener('click', () => {
    toast('Opening the feedback form');
    window.open('http://goto.google.com/twotwenty-feedback');
  });
  
  const save = document.createElement('button');
  save.className = 'main';
  save.textContent = 'Save changes';
  save.title =
      'Changes are saved automatically.' +
      'This button is a dummy.';
  save.addEventListener('click', () => {
    toast('All changes saved');
    setTimeout(() => window.location.reload(), 1000);
  });
  
  const update = document.createElement('button');
  update.textContent = 'Update data';
  update.title =
      'Please paste the data now to update.';
  update.addEventListener('click', () => {
    toast('Please paste now (Ctrl-V).');
  });
  
  const reset = document.createElement('button');
  reset.textContent = 'Reset default values';
  reset.title =
      'This will reset all settings to default.' +
      '\nYou will lose your count and your log.' +
      '\nRemember to put your initials back in.';
  reset.addEventListener('click', () => {
    chrome.storage.local.clear();
    set(defaultStores);
    toast('Resetting default values');
    setTimeout(() => window.location.reload(), 1000);
  });
  
  const buttons = document.getElementById('buttons');
  buttons.append(feedback);
  buttons.append(save);
  // buttons.append(reset);
  buttons.append(update);
  
  // Handle data updates when pasted into the Options screen.
  document.addEventListener('paste', () => {
    const sink = document.createElement('textarea');
    sink.style.position = 'absolute';
    sink.style.top = '-1000px';
    document.body.append(sink);
    sink.focus();
    setTimeout(async () => {
      try {
        const string = sink.value;
        const json = (string.slice(-1) === '=') ? atob(string) : string;
        const object = JSON.parse(json);
        toast('Processing');
        set(object);
        await wait(1500);
        toast('Success. Please refresh EWOQ.');
      } catch (e) {
        console.log(e);
        toast('Failed. Could not process that.');
        await wait(1000);
        toast('Please check that you copied everything.');
      }
      sink.remove();
    }, 100);
  })
};
undefined;

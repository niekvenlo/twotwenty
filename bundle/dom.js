var {ー, ref} = (function domAccessModule() {
  'use strict';

  /**
   * @fileoverview Exports the ー function, which enables and regulates
   * DOM access. Proxy objects for HTMLElements are returned, which
   * expose a limited number of methods, and which log
   * changes.
   */

  const EDITABLE_ELEMENT_TYPES =
      Object.freeze(['textarea', 'select-one', 'text']);

  const htmlElementWeakMap = new WeakMap();

  /**
   * Test whether an HTMLElement is hidden through CSS or Javascript.
   *
   * @param {HTMLElement} htmlElement
   * @return {boolean} Is the HTMLElement being displayed on the page?
   */
  function isHidden(htmlElement) {
    return (htmlElement.offsetParent === null);
  }

  /**
   * Get a numbered name.
   *
   * @param {string=} name
   * @param {number} idx
   * @return {string}
   * @example - namePlusIdx('Example name', 3) => 'ExampleName_3'
   */
  function namePlusIdx(name = 'Unnamed', idx) {
    return `${util.cap.camelCase(name)}_${idx + 1}`;
  }
  atest.group('namePlusIdx', {
    'One word': () => namePlusIdx('Name', 3) === 'Name_4',
    'Two words': () => namePlusIdx('First second', 0) === 'FirstSecond_1',
  });

  /**
   * Get coordinates of an HTMLElement, taking scroll position into account.
   *
   * @param {HTMLElement} htmlElement
   * @return {Object} o
   * @return {number} o.top
   * @return {number} o.left
   * @return {number} o.width
   * @return {number} o.height
   */
  function getCoords(htmlElement) {
    const rect = htmlElement.getBoundingClientRect();
    return {
      top: parseInt(scrollY + rect.top),
      left: parseInt(scrollX + rect.left),
      width: parseInt(rect.width),
      height: parseInt(rect.height),
    };
  }

  /**
   * Touch an HTMLElement, so that GWT registers it.
   *
   * @param {HTMLElement} htmlElement
   */
  async function touch(htmlElement) {
    await util.wait();
    // Blur signals a change to GWT
    util.dispatch(
      'blur, change, input, keydown',
      {touch: true},
      htmlElement,
    );
  }
  atest.group('touch', {
    'Listen for events': async () => {
      let count = 0;
      const fakeElement = {
        dispatchEvent: () => count++,
      };
      touch(fakeElement);
      await util.wait();
      return count === 4
    }
  });

  /**
   * All changes to HTMLElement values should be routed through this function.
   * Changes can be logged and checked.
   *
   * @param {HTMLElement} htmlElement
   * @param {string} name
   * @param {string} newValue - The new value that should conditionally be set.
   */
  function safeSetter(htmlElement, name, newValue) {
    const currentValue = htmlElement.value;
    if (currentValue === newValue) {
      user.log.low(
        `No change to ${name}.`,
        {debug: true, print: false, save: false, toast: false},
      );
      return;
    }
    if(!EDITABLE_ELEMENT_TYPES.includes(htmlElement.type)) {
      throw new TypeError(`Cannot set value on ${htmlElement.type} elements`);
    }
    htmlElement.value = newValue;
    touch(htmlElement);
    user.log.changeValue( // No longer logging every change to a value.
      `${name} '${currentValue}' => '${newValue}'.`,
      {debug: true, print: false, save: false, toast: false},
    );
  }
  atest.group('safeSetter', {
    'Basic set value on supported element': async () => {
      let count = 0;
      const fakeElement = {
        type: EDITABLE_ELEMENT_TYPES[0],
        dispatchEvent: () => count++,
      };
      safeSetter(fakeElement, 'Name', 'newValue');
      await util.wait();
      const numTouchEvents = 4;
      return fakeElement.value = 'newValue' && count === numTouchEvents;
    },
    'Fail on unsupported element': async () => {
      let count = 0;
      const fakeElement = {
        type: 'unsupported',
        dispatchEvent: () => count++,
      };
      return atest.throws(() => {
        safeSetter(fakeElement, 'Name', 'newValue')
      });
    },
  });

  /**
   * Get a fresh proxy matching the select and pick parameters.
   * If the DOM updates, this may return a proxy to a different HTMLElement
   * than the original proxy.
   *
   * @param {Object} freshSelector
   * @param {string} freshSelector.select
   * @param {number[]} freshSelector.pick
   * @param {string} name
   * @return {Object} proxy
   */
  function getFreshElement(freshSelector, name) {
    return ー({...freshSelector, name, mode: 'static'});
  }

  /**
   * Make a basic proxy for an HTMLElement, to serve as the basis for more
   * specific versions.
   *
   * @param {Object} o
   * @param {HTMLElement} o.htmlElement
   * @param {string} o.name
   * @param {Object} o.freshSelector
   * @return {Object} proxy
   */
  function makeBasicProxy({htmlElement, name, freshSelector}) {
    if (!util.isHTMLElement(htmlElement)) {
      throw new TypeError('Not an HTMLElement');
    }
    const proxy = {
      name,
      value: htmlElement.value,
      get checked() {
        return htmlElement.checked;
      },
      set css(styles) {
        for (let rule in styles) {
          htmlElement.style[rule] = styles[rule];
        }
      },
      get disabled() {
        return htmlElement.disabled;
      },
      set spellcheck(on) {
        htmlElement.spellcheck = on;
      },
      get textContent() {
        return htmlElement.textContent;
      },
      set textContent(newValue) {
        htmlElement.textContent = newValue;
      },
      get tabIndex() {
        return htmlElement.tabIndex;
      },
      set tabIndex(value) {
        htmlElement.tabIndex = value;
      },
      click() {
        htmlElement.click();
      },
      blur() {
        htmlElement.blur();
      },
      focus() {
        htmlElement.focus();
      },
      scrollIntoView() {
        htmlElement.scrollIntoView();
      },
      touch() {
        touch(htmlElement);
      },
      toString() {
        return `${name}: ${htmlElement.value}`;
      },
      fresh() {
        return ー({...freshSelector, name, mode: 'user-editable'});
      },
      getCoords() {
        return getCoords(htmlElement);
      },
      unsafe() {
        return htmlElement;
      },
    }
    return proxy;
  }

  /**
   * Make a specific type of HTMLElement proxy, based on the passed in mode.
   *
   * @param {Object} o
   * @param {HTMLElement} o.htmlElement
   * @param {string} o.name
   * @param {string} o.mode
   * @param {Object} o.freshSelector
   * @return {Object} proxy
   */
  function makeProxy({htmlElement, name, mode, freshSelector}) {
    if (!util.isHTMLElement(htmlElement)) {
      throw new TypeError('Not an HTMLElement');
    }
    const proxy = makeBasicProxy({
      htmlElement,
      name,
      freshSelector
    });
    proxy.name = name;
    proxy.mode = mode;

    function goodSetter(value) {
      safeSetter(htmlElement, name, value)
    }
    function brokenSetter(newValue) {
      throw new Error(
          `Cannot set value of ${name} to '${newValue}'. ` +
          `Element is not programmatically editable.`
      );
    }
    if (proxy.mode === 'static') {
      return Object.freeze({...proxy});
    }
    if (proxy.mode === 'programmable') {
      Object.defineProperty(
        proxy, 'value', {get: () => htmlElement.value, set: goodSetter,}
      );
      return Object.seal(proxy);
    }
    if (proxy.mode === 'user-editable') {
      Object.defineProperty(
        proxy, 'value', {get: () => htmlElement.value, set: brokenSetter,}
      );
      return Object.seal(proxy);
    }
    throw new Error('No valid mode set');
  }

  /**
   * Create an object that can be used to find a fresh HTMLElement on the
   * page. This is based on the original values passed into the ー function.
   *
   * @param {Object} options
   * @param {number} idx
   */
  function makeFreshSelector(options, idx) {
    const {select, pick} = options;
    return {
      select,
      pick: (pick ? [pick[idx]] : []),
    };
  }

  /**
   * Find or create a proxy matching an HTMLElement.
   *
   * @param {HTMLElement} htmlElement
   * @param {number} idx
   * @param {Object} options
   */
  function toProxy(htmlElement, idx, options) {
    options.mode = 'programmable';
    if (!util.isHTMLElement(htmlElement)) {
      throw new TypeError('Not an HTMLElement');
    }
    const cached = htmlElementWeakMap.get(htmlElement);
    if (cached && options.mode === 'fresh') {
      options.mode = cached.mode;
    } else if (cached) {
      if (cached.mode !== options.mode && false) { // @todo Fix warning
        user.log.warn(
          `Didn't change ${options.name} element mode from ${cached.mode}` +
          ` to ${options.mode}`,
          true,
        )
      }
      return cached;
    } else if (options.mode === 'fresh') {
      mode = 'static';
    }
    const proxy = makeProxy({
      htmlElement,
      name: namePlusIdx(options.name, idx),
      mode: options.mode,
      freshSelector: makeFreshSelector(options, idx),
    });
    if (options.mode !== 'fresh') {
      htmlElementWeakMap.set(htmlElement, proxy);
    }
    return proxy;
  }
  atest.group('toProxy', {
    'Throws without an HTMLElement': () => {
      return atest.throws(() => toProxy({}, 0, {}));
    },
  });

  /**
   * Access the DOM and find HTMLElements matching the parameters.
   * Select and pick can be used to find elements in the entire page, while
   * rootSelect and rootNumber can be used to narrow the search down to a
   * specific node of the page.
   * For example, {select: 'button', pick: [2,0,1]} will return the 2nd,
   * 0th and 1st buttons on the page, in that order.
   * {rootSelect: 'div', rootNumber: 4, select: 'button', pick: [2]} will
   * return the 2nd button from the 4th div.
   *
   * @param {Object} o
   * @param {string} o.rootSelect
   * @param {number} o.rootNumber
   * @param {string} o.select
   * @param {number[]} o.pick
   * @param {HTMLElement[]}
   */
  function getHtmlElements({
    rootSelect,
    rootNumber = '0',
    select,
    pick,
    withText,
  }) {
    const simpleSelect = () => {
      return [...document.querySelectorAll(select)];
    }
    const complexSelect = () => {
      const root = [...document.querySelectorAll(rootSelect)][rootNumber];
      if (!root) {
        return [];
      }
      return [...root.querySelectorAll(select || '*')] || [];
    }
    const allElements = (rootSelect) ? complexSelect() : simpleSelect();
    const filterByText = (el) => {
      if (!withText) {
        return true;
      }
      return el.value === withText || el.textContent === withText;
    };
    if (!pick) {
      return allElements.filter(filterByText);
    }
    const pickedElements = [];
    for (let number of pick) {
      const picked = allElements[number];
      if (picked) {
      pickedElements.push(picked);
      }
    }
    return pickedElements.filter(filterByText);
  }
  atest.group('getHtmlElements', {
    'Throws without input': () => atest.throws(() => getHtmlElements()),
    'Returns an array': () => {
      return Array.isArray(getHtmlElements({rootSelect: 'div'}));
    },
  })

  function checkSupportedProps(prop) {
    for (let supported of Object.keys(eventReactions.SUPPORTED_EVENTS)) {
      if (prop.includes(supported)) {
        return;
      }
    }
    throw new TypeError(
      `${prop}  is not a supported event. Please use:` +
      util.bulletedList(eventReactions.SUPPORTED_EVENTS)
    );
  }
  atest.group('checkSupportedProps', {
    'onLoad is ok': () => !atest.throws(() => checkSupportedProps('onLoad')),
    'onError fails': () => atest.throws(() => checkSupportedProps('onError')),
    'load fails': () => atest.throws(() => checkSupportedProps('load')),
  });

  function checkReactionsAreFunctions(name, action, reactions) {
    util.alwaysArray(reactions).forEach(reaction => {
      if (typeof reaction !== 'function') {
        throw new TypeError(
          `Failed to add '${action}' reaction to ${name}.` +
          `Reaction should be a function, not ${typeof reaction}.`,
        );
      }
    });
  }
  atest.group('checkReactionsAreFunctions', {
    'Array of functions': () => {
      const reactions = [() => {}, () => {}];
      return !atest.throws(() => {
        checkReactionsAreFunctions('Test 1', 'onLoad', reactions);
      });
    },
    'Single function': () => {
      const reactions = () => {};
      return !atest.throws(() => {
        checkReactionsAreFunctions('Test 1', 'onLoad', reactions);
      });
    },
    'Array with undefined': () => {
      const reactions = [() => {}, () => {}, undefined];
      return atest.throws(() => {
        checkReactionsAreFunctions('Test 1', 'onLoad', reactions);
      }, TypeError);
    },
    'Single undefined': () => {
      const reactions = undefined;
      return atest.throws(() => {
        checkReactionsAreFunctions('Test 1', 'onLoad', reactions);
      }, TypeError);
    },
  });

  /**
   * Set event reactions on an HTMLElement.
   *
   * @param {Object[]} htmlElements
   * @param {Object[]} proxies
   * @param {Object} options - All properties in the options object for
   * which the name begins with 'on' will be processed.
   */
  function setAllReactions(htmlElements, proxies, options) {
    const reactions = {};
    for (let prop in options) {
      if (/^on/.test(prop)) {
        checkSupportedProps(prop);
        checkReactionsAreFunctions(options.name, prop, options[prop]);
        reactions[prop] = options[prop];
      }
    }
    proxies.forEach((proxy, idx, group) => {
      const htmlElement = htmlElements[idx];
      const context = {proxy, idx, group};
      eventReactions.set(htmlElement, reactions, context);
    });
  }

  const ref = {
    fresh(name) {
      const cached = ref[name] || [];
      return cached[0].fresh()[0];
    }
  };

  /**
   * Find and process HTMLElements to produce proxies and attach event
   * reactions.
   *
   * @param {Object} options
   */
  function ー(options) {
    const htmlElements = getHtmlElements(options);
    const proxies = htmlElements.map((element,idx) => {
      return toProxy(element, idx, options);
    });
    proxies.forEach(proxy => {
      if (options.css) {
        proxy.css = options.css;
      }
    });
    if (options.mode !== 'fresh') {
      setAllReactions(htmlElements, proxies, options);
    }
    if (options.ref) {
      if (typeof options.ref !== 'string') {
        throw new TypeError(`Ref should be a string, not ${typeof options.ref}.`);
      }
      ref[options.ref] = proxies;
    }
    return proxies;
  }

  return {ー, ref};
})();
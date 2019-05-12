'use strict';

var util = (function utilityModule() {

  /**
   * @fileoverview Utility module
   */

  const DEFAULT_DELAY = 15; // milliseconds
  const DEFAULT_RETRIES = 20;
  const BULLETLIST_DEFAULT_SPACES = 4;
  const BULLETLIST_FUNCTION_STRING_LENGTH = 50;

  /**
   * Return any input in the form of an array.
   *
   * @param {*|*[]} input
   * @return {*[]}
   */
  function alwaysArray(...input) {
    return [...input].flat();
  }
  atest.group('alwaysArray', {
    '5 becomes an array': () => Array.isArray(alwaysArray(5)),
    '5 becomes [5]': () => alwaysArray(5)[0] === 5,
    '[5] remains an array': () => Array.isArray(alwaysArray([5])),
    '[5] remains [5]': () => alwaysArray([5])[0] === 5,
  });
  
  /**
   * Move focus to, click on, or scroll to a proxy.
   *
   * @param {(Object|Object[])} on - A proxy or an array of proxies.
   * @param {number} n - The number of the proxy on which to act.
   * @param {string|string[]} actions - A string or an Array of strings
   * describing the actions to take.
   * @example: attention(buttons, 0, 'click'); // => Clicks on the first button.
   * @throws {TypeError} When n is not a number.
   */
  function attention(on, n = 0, actions) {
    if (typeof n !== 'number') {
      throw new TypeError('Attention expects a number, not ' + n);
    }
    if (Array.isArray(on)) {
      on = on[n]//.slice(n)[0];
    }
    if (!on || !on.click) {
      return false;
    }
    if (actions.includes('click')) {
      on.click();
    }
    if (actions.includes('focus')) {
      on.focus();
    }
    if (actions.includes('scrollIntoView')) {
      on.scrollIntoView();
    }
    return true;
  }
  atest.group('attention', {
    'Simple click': () => {
      let clicked = false;
      const el = {
        click() { clicked = true },
      };
      attention([el], 0, 'click');
      return clicked;
    },
    'Focus and scroll': () => {
      let clicked = false;
      let focused = false;
      let scrolled = false;
      const el = {
        click() { clicked = true },
        focus() { focused = true },
        scrollIntoView() { scrolled = true },
      };
      attention([el], 0, 'focus, scrollIntoView');
      return focused && scrolled;
    },
    'Fails quietly': () => attention([], 1, 'click') === false,
    'Throws': () => atest.throws(() => attention([], 'click')),
  });

  /**
   * Play a short beep.
   */
  async function beep() {
    const audioFile = new Audio(
    'data:audio/wav;base64,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 /////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////VEFHAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAU291bmRib3kuZGUAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAMjAwNGh0dHA6Ly93d3cuc291bmRib3kuZGUAAAAAAAAAACU='
    );
    audioFile.play();
  }
  beep = debounce(beep, 4000);

  /**
   * Create a bulleted list from an Object.
   * For function elements or function values, the function name and a
   * string description of the function is printed.
   *
   * @param {Array|Object} input - Array or Object
   * @param {number=} spaces - The number of spaces to precede each item.
   * @return {string}
   * @example:
   * bulletedList(['One', 'Two']) // =>
   *     * One
   *     * Two
   */
  function bulletedList(input, spaces = BULLETLIST_DEFAULT_SPACES) {
    if (typeof input !== 'object') {
      throw new TypeError('Requires an Object or Array');
    }
    const spacer = (star) => {
      return ' '.repeat(spaces) + ((star) ? '* ' : '  ');
    }
    const toArray = (obj) => {
      const elToString = (entry) => `${entry[0]}: ${toString(entry[1])}`
      return Object.entries(input).map(elToString);
    }
    function toString(entry) {
      if (typeof entry === 'function') {
        const string = entry.toString()
             .slice(0, BULLETLIST_FUNCTION_STRING_LENGTH)
             .replace(/(\n|\s+)/g, ' ');
        return (entry.name)
            ? `${entry.name}\n${spacer()}${string}`
            : string;
      }
      return entry;
    }
    const array = (Array.isArray(input)) ? input : toArray(input);
    if (array.length < 1) {
      return '';
    }
    return '\n' + spacer(true) + array.map(toString).join('\n' + spacer(true));
  }
  atest.group('bulletedList', {
    'Simple array': () => bulletedList([1,2,3]) === '\n    * 1\n    * 2\n    * 3',
    'Simple object': () => {
      return bulletedList({namedKey: 1}) === `\n    * namedKey: 1`;
    },
    'Unnamed function': () => {
      const string = `\n    * () => { 'body of function'}`;
      return bulletedList([() => { 'body of function'}]) === string;
    },
    'Named function': () => {
      const namedFunction = () => { 'body of function'};
      const string = `\n    * namedFunction\n      () => { 'body of function'}`;
      return bulletedList([namedFunction]) === string;
    },
    'Object with functions': () => {
      const string = `\n    * namedKey: namedKey\n      () => { 'body of function'}`;
      return bulletedList({namedKey: () => { 'body of function'}}) === string;
    },
  });

  /**
   * Add capitalisation to a string.
   */
  var cap = (function() {
    const firstLetter = (string) => string.replace(/^./, c => c.toUpperCase());
    const eachWord = (string) => string.replace(/\w+/g, firstLetter);
    const camelCase = (string) => {
      return cap.eachWord(string.toLowerCase()).replace(/\s+/, '');
    };
    return {
      camelCase,
      eachWord,
      firstLetter,
    }
  })();
  atest.group('cap', {
    'First letter': () => cap.firstLetter('abc abc') === 'Abc abc',
    'Each word': () => cap.eachWord('abc abc') === 'Abc Abc',
    '1 number': () => cap.firstLetter('1 number') === '1 number',
    '2number': () => cap.firstLetter('2number') === '2number',
    'Japanese': () => cap.eachWord('お問い合わせ') === 'お問い合わせ',
  });

  /**
   * Debounce function calls.
   *
   * @param {function} func - Function to be debounced.
   * @param {number} delay - Delay in milliseconds.
   */
  function debounce(func, delay = DEFAULT_DELAY) {
    let timer = false;
    /**
     * @param {...*} params - Params passed to the debounced function are
     * passed to the wrapped function when it is called.
     * @return {*} The debounced function returns whatever the wrapped
     * function returns.
     */
    function debounced(...params) {
      if (!timer) {
        timer = true;
        wait(delay).then(() => timer = false);
        return func(...params);
      }
    }
    return debounced;
  }
  atest.group('debounce', {
    'Runs only once if called twice quickly': async () => {
      let count = 0;
      const func = () => count++;
      const funcDebounced = debounce(func, 10);
      funcDebounced();
      funcDebounced();
      return count === 1;
    },
    'Runs twice if called with delay': async () => {
      let count = 0;
      const delay = 10;
      const func = () => count++;
      const funcDebounced = debounce(func, delay);
      funcDebounced();
      await wait(delay * 2);
      funcDebounced();
      return count === 2;
    },
    'Delay is set': () => DEFAULT_DELAY !== undefined,
  });

  /**
   * Returns a function that will run the input function with a delay.
   *
   * @param {function} func - The function to be decorated.
   * @param {number} ms - The delay in milliseconds.
   * @return {function}
   */
  function delay(func, ms = DEFAULT_DELAY) {
    async function delayed(...params) {
      await wait(ms);
      return func(...params);
    }
    return delayed;
  }
  atest.group('delay', {
    'Effect delayed': async () => {
      let count = 0;
      let increment = () => count++;
      increment = delay(increment);
      increment();
      const unaffectedCount = count;
      await wait();
      const affectedCount = count;
      return unaffectedCount === 0 && affectedCount === 1;
    },
  });

  /**
   * Dispatch events.
   *
   * @param {string} types - Comma separated string of event types.
   * E.g. 'keydown', 'guiUpdate' or 'blur, change, input'.
   * @param {Object} o
   * @param {Object=} o.detail - Optional payload.
   * @param {(HTMLElement|HTMLDocument)=} o.target - The element emitting
   * the event.
   */
  function dispatch(types, detail, target = document) {
    types.split(/, ?/).forEach(type => {
      const event = (detail)
          ? new CustomEvent(type, {detail}, {bubbles: true})
          : new Event(type, {bubbles: true});
      target.dispatchEvent(event);
    });
  }
  atest.group('Dispatch', {
    'Click': () => {
      let count = 0;
      document.addEventListener('click', () => count++);
      dispatch('click, click');
      return count === 2;
    },
    'Testing Event': () => {
      let count = 0;
      document.addEventListener('testingEvent', () => count++);
      dispatch('testingEvent', {example: 'example'});
      return count === 1;
    },
    'Testing Event payload': () => {
      let payload;
      document.addEventListener('testingEvent', ({detail}) => payload = detail);
      dispatch('testingEvent', {example: 'example'});
      return payload.example === 'example';
    },
  });
  
  

  /**
   * Run a function that expects a callback function. The Promise resolves
   * when the function runs the callback, and returns the result.
   *
   * @return {Promise}
   */
  async function doAsync(func, param, cb) {
    const retries = 25;
    const delay = 20;
    let done = false;
    let ret;
    let valve = 0;
    
    function resolve(result) {
      done = true;
      cb && cb(result);
      ret = result;
    }
    
    func(param, resolve);
    while (!done && valve++ < retries) {
      await wait(delay);
    }
    return ret;
  }
  
  /**
   * Given an Array of objects with value parameters, return an Array of
   * those objects which contain duplicate values among the group.
   * UNUSED
   *
   * @param {Object[]} proxies - Objects with value parameters
   */
  function duplicateValue(proxies) {
    const values = [];
    const duplicateValues = [];
    const duplicateProxies = [];
    for (let proxy of proxies) {
      if (values.includes(proxy.value)) {
        duplicateValues.push(proxy.value);
      }
      proxy.value && values.push(proxy.value);
    }
    for (let proxy of proxies) {
      if (duplicateValues.includes(proxy.value)) {
        duplicateProxies.push(proxy);
      }
    }
    return duplicateProxies;
  }

  /**
   * Map a url to its domain.
   *
   * @param {string} url
   * @return {string}
   */
  function getDomain(url) {
    if (url === '') {
      return '';
    }
    if (!/^https?:\//.test(url)) {
      return '';
    }
    const domain = normaliseUrl(url).match(/\/\/([^\/]*)/);
    if (!domain) {
      return '';
    }
    return domain[1];
  }
  atest.group('getDomain', {
    'https://example.com':
        () => getDomain('https://example.com') === 'example.com',
    'https://www.example.com':
        () => getDomain('https://www.example.com') === 'www.example.com',
    'https://www.example.com/test.html':
        () => getDomain('https://www.example.com/test.html') === 'www.example.com',
    'Not a url':
        () => getDomain('Not a url') === '',
  });

  /**
   * Test whether an object is an HTMLElement or HTMLDocument.
   *
   * @param {Object=} HTMLElement - Object to be tested
   * @return {boolean} Returns true if an HTMLElement or HTMLDocument is
   * passed in.
   */
  function isHTMLElement(htmlElement) {
    return (
      htmlElement instanceof HTMLElement ||
      htmlElement instanceof HTMLDocument
    );
  }
  atest.group('isHTMLElement', {
    'An object: false': () => isHTMLElement({}) === false,
    'The document: true': () => isHTMLElement(document) === true,
    'Document body: true': () => isHTMLElement(document.body) === true,
  });
  
  /**
   *
   */
  function normaliseUrl(url) {
    if (!punycode) {
      return url;
    }
    return url.replace(/xn--[^.]*/g, (puny) => {
      return punycode.decode(puny.replace(/^xn--/,''));
    });
  }
  atest.group('normaliseUrl', {
    'Japanese': () => {
      const url =
          'https://xn--m7rz27cmsk.xn--u9j691gecx37d21ah4eg9p18obijc8r.com/' +
              'edogawa';
      const normal =
          'https://給湯器.激安交換工事の正直屋.com/edogawa';
      return normaliseUrl(url) === normal;
    }
  });
  
  /**
   * Returns an async function that will run the input function
   * repeatedly, until it returns a truthy value.
   *
   * @param {function} func - The function to be decorated.
   * @param {number} retries - The number of times to run the function.
   * @param {number} ms - The delay between iterations in milliseconds.
   * @param {boolean} suppressError - Should an error be thfown if the
   * function never returned a truthy value?
   * @return {Promise} A Promise which will return the result of the function
   * if it ran succesfully, or throw an Error otherwise.
   * @throws {Error} If the function never succeeds and suppressError is not
   * true.
   */
  function retry(
    func,
    retries = DEFAULT_RETRIES,
    delay = DEFAULT_DELAY,
    suppressError = false
  ) {
    let attempts = 0;
    async function retrying(...params) {
      while (attempts++ < retries) {
        await wait(delay);
        const ret = func(...params);
        if (ret) {
          return ret;
        }
      }
      if (suppressError) {
        return false;
      }
      throw new Error(
        `Failed. Ran ${func.name || 'unnamed function'} ${retries} times`
      );
    }
    return retrying;
  }
  atest.group('retry', {
    'Test 1': async () => {
      let count = 0;
      let willFailInitially = () => count++ > 10;
      willFailInitially = retry(willFailInitially, 12, 0);
      return willFailInitially();
    },
    'Test 2': async () => {
      let count = 0;
      let willFailInitially = () => count++ > 10;
      willFailInitially = retry(willFailInitially, 5, 0);
      let error;
      await willFailInitially().catch((e) => error = e);
      return !!error;
    },
  });
  
  /**
   * Swap the values of two proxies.
   *
   * @param {Object} one - Proxy
   * @param {Object} two - Proxy
   */
  function swapValues(one, two) {
    [one.value, two.value] = [two.value, one.value];
  }
  atest.group('swapValues', {
    'Simple swap': () => {
      const one = {value: 'one'};
      const two = {value: 'two'};
      swapValues(one, two);
      return one.value === 'two' && two.value === 'one';
    },
  });

  /**
   * The inverse of calling toString on a RegExp.
   * Transforms a string of the format '/abc/i' to a RegExp.
   *
   * @param {string}
   * @return {RegExp}
   */
  const toRegex = (string)=> {
    try {
      const [,regex,flags] = string.match(/\/(.+)\/([gimuy]*)/);
      return RegExp(regex, flags);
    } catch (e) {
      console.debug('Cannot make RegExp from ' + string);
      return;
    }
  }
  atest.group('toRegex', {
    'Simple': () => toRegex('/abc/gi').toString() === '/abc/gi',
    'Complex': () => toRegex('/^\d?[a-c]+/g').toString() === '/^d?[a-c]+/g',
    'Malformed string': () => toRegex('abc/gi') === undefined,
  });
  
  /**
   * Confirm that a parameter is of a valid type.
   * Throws an Error otherwise.
   *
   * @param {Function} func
   * @param {string} typesString - Types to match, comma separated.
   * @throws {TypeError}
   */
  function typeCheck(input, typesString) {
    const types = typesString.split(/, ?/);
    if (types.every(type => typeOf(input) !== type)) {
      const desc = (input || '').toString().slice(0,10);
      throw TypeError(`TypeChecker failed: ${desc} is not: ${bulletedList(types)}`);
    };
  }
  atest.group('typeCheck', {
    'Test 1': () => {
      return atest.throws(() => typeCheck('text', 'function'), TypeError);
    },
    'Test 2': () => {
      return atest.throws(() => typeCheck('text', 'boolean, undefined'), TypeError);
    },
    'Test 3': () => !(typeCheck('text', 'string')),
    'Test 4': () => !(typeCheck('text', 'string, boolean')),
    'Test 5': () => !(typeCheck(true, 'string, boolean')),
  });

  /**
   * Wraps typeof but returns 'array' for Array input.
   *
   * @param {*} input
   * @return {string}
   */
  function typeOf(input) {
    if (Array.isArray(input)) {
      return 'array';
    }
    return typeof input;
  }
  atest.group('typeOf', {
    'undefined': () => typeOf(undefined) === 'undefined',
    'number': () => typeOf(5) === 'number',
    'array': () => typeOf([]) === 'array',
    'object': () => typeOf({}) === 'object',
    'function': () => typeOf(() => {}) === 'function',
  });

  /**
   * Returns a Promise that will resolve after a delay.
   *
   * @param {number=} ms - Time to wait before continuing, in milliseconds
   * @return {Promise} Promise which will resolve automatically.
   */
  function wait(ms = DEFAULT_DELAY) {
    return new Promise((resolve) => setTimeout(() => resolve(), ms));
  }
  atest.group('wait', {
    'Wait': async () => {
      let count = 0;
      let ms = 10;
      setTimeout(() => count++, ms);
      const unaffectedCount = count;
      await wait(2 * ms);
      const affectedCount = count;
      return unaffectedCount === 0 && affectedCount === 1;
    },
    'DEFAULT': () => DEFAULT_DELAY !== undefined,
  });

  return {
    alwaysArray,
    attention,
    beep,
    bulletedList,
    cap,
    debounce,
    delay,
    dispatch,
    doAsync,
    duplicateValue,
    getDomain,
    isHTMLElement,
    normaliseUrl,
    retry,
    swapValues,
    toRegex,
    typeCheck,
    typeOf,
    wait,
  };
})();
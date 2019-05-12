'use strict';

var user = (function userDataModule() {

  /**
   * @fileoverview Exposes stateful objects to keep track of things.
   * * access - Data storage access.
   * * config - manage configuration settings.
   * * counter - count things.
   * * log - log things.
   */

  const LOCALSTORE_BASENAME = 'twoTwentyOne';
  const CONFIG_STORE_NAME = 'Configuration';
  const COUNTER_STORE_NAME = 'Counter';
  const LOGBOOK_STORE_NAME = 'LogBook';
  const LOG_MAX_LENGTH = 5000; // entries
  const LOG_ENTRY_MAX_LENGTH = 600; // characters per log entry
  const LOG_PAGE_SIZE = 25; // entries per page
  const NO_COLOR_FOUND = 'yellow'; //
  const TIMESTAMP_STYLE = 'color: grey';
  const LOG_TYPES = {
    log: 'black',
    notice: 'DodgerBlue',
    warn: 'OrangeRed',
    ok: 'LimeGreen',
    low: 'Gainsboro',
    changeValue: 'LightPink',
    config: 'MediumOrchid',
    counter: 'DarkCyan',
    submit: 'DodgerBlue',
    skip: 'DeepSkyBlue',
  };

  /**
   * Manage dynamic data stores.
   * Note: Data was originally stored as JSON.
   */
  const access = (function storesAccessMiniModule() {

    const cached = (function chromeLocalModule() {
      let storeCache = {};

      const warnToRefresh = util.debounce(() => {
        alert(`TwoTwenty has updated. Please refresh EWOQ.`);
      }, 5000);
      
      function populateCacheFromChromeStorage() {
        if (!chrome.storage) {
          warnToRefresh();
          return;
        }
        chrome.storage.local.get(null, (result) => {
          storeCache = result;
        });
      }
      populateCacheFromChromeStorage();
      setInterval(populateCacheFromChromeStorage, 2e5); // Update every ~3min
      
      async function destroyStore(storeName) {
        if (!storeCache.hasOwnProperty(storeName)) {
          throw new TypeError('Cannot find store to destroy');
        }
        delete storeCache[storeName];
        chrome.storage.local.remove([storeName]);
      }
      function getStore(storeName) {
        if (storeCache.hasOwnProperty(storeName)) {
          return storeCache[storeName];
        }
      }
      async function setStore(storeName, data) {
        if (!storeName) {
          throw new TypeError('Cannot create nameless store');
        }
        if (typeof data !== 'object') {
          throw new TypeError('Data should be an object, not ' + typeof data);
        }
        storeCache[storeName] = data;
        try {
          await chrome.storage.local.set({[storeName]: data});
        } catch (e) {
          if (e.message.includes('Invocation of form')) {
            console.debug('Expected Error: Invocation of form', e);
          } else if (e.message.includes(`Cannot read property 'local'`)) {
            warnToRefresh();
          } else {
            console.debug('Weird Store Error', e);
          }
        }
      }
      return {
        destroyStore,
        getStore,
        setStore,
      }
    })();
    
    function access(feature, locale = '', {data, append} = {}) {
      if (!data && !append) {
        if (!locale) {
          return cached.getStore(feature) || [];
        }
        return [
          ...(cached.getStore(feature) || []),
          ...(cached.getStore(feature + locale) || []),
        ];
      }
      if (data) {
        cached.setStore(feature + (locale || ''), data);
        return;
      }
      if (append) {
        if (locale) {
          const store = cached.getStore(feature + locale) || [];
          store.push(append);
          cached.setStore(feature + locale, store);
        } else {
          const store = cached.getStore(feature) || [];
          store.push(append);
          cached.setStore(feature, store);
        }
      }
    }
    
    return access;
  })();

  /**
   * Create a human readable string timestamp.
   *
   * @param {Date} d - A date to turn into a matching timestamp.
   * For today's Date, returns a short format (hh:mm)
   * For other Dates, returns a long format (MM/DD hh:mm:ss)
   * @return {string}
   */
  function timestamp(d = new Date()) {
    if (!(d instanceof Date)) {
      console.debug('Date', d);
      d = new Date();
    }
    /** Cast numbers into a zero prefixed two digit string format */
    const c = new Date();
    const cast = (/** number */n) /** string */ => ('0' + n).slice(-2);
    const sameDate = (c.getDate() - d.getDate() === 0);
    const sameMonth = (c.getMonth() - d.getMonth() === 0);
    const sameYear = (c.getFullYear() - d.getFullYear() === 0);
    const isTodaysDate = sameDate && sameMonth && sameYear;
    const month = cast(d.getMonth() + 1);
    const date = cast(d.getDate());
    const hrs = cast(d.getHours());
    const min = cast(d.getMinutes());
    const sec = cast(d.getSeconds());
    const longForm = `${month}/${date} ${hrs}:${min}:${sec}`;
    const shortForm = `${hrs}:${min}`;
    return (isTodaysDate) ? shortForm : longForm;
  }
  atest.group('timestamp', {
    'Without a parameter': () => {
      return timestamp().length === 5;
    },
    'Short length': () => {
      const today = new Date();
      return timestamp(today).length === 5;
    },
    'Long length': () => {
      const earlier = new Date('01-01-2019 12:34:56');
      return timestamp(earlier).length === 14;
    },
  });

  /**
   * Dispatch GUI update packets. The GUI module  is reponsible for
   * integrating packets into a consistent state.
   *
   * @param {Object} packet - A packet containing a state update to the GUI.
   * @example - updateGui({counters: {one: 21}});
   */
  function updateGui(packet) {
    util.dispatch('guiUpdate', packet);
  }

  /**
   * Track configuration settings. Settings are loaded from localStorage on
   * load, but changes are not saved by default.
   * #get(name) returns a value if a config setting is loaded, or undefined.
   * #set(name, newValue, save) adds a value to the config options in memory
   * and optionally updates the config options stored in localStorage.
   */
  const config = (function configMiniModule() {
    function getStore() {
      return access(CONFIG_STORE_NAME);
    }

    function get(name) {
      const allSettings = getStore();
      const setting = allSettings.find((setting) => setting.name === name);
      if (!setting) {
        return;
      }
      return setting.value;
    }

    function set(name, newValue) {
      const allSettings = getStore();
      const currentSetting = get(name);
      const idx = allSettings.findIndex((setting) => setting.name === name);
      currentSetting.value = newValue;
      allSettings[idx] = currentSetting;
      access(CONFIG_STORE_NAME, undefined, {data: allSettings});
    }
    return {
      get,
      set,
    };
  })();

  /**
   * Object with methods to create and manage counters.
   * #add(name) create a new counter or increments it if it already exists.
   * #get(name) returns the count of a named counter (or -1 if no such counter
   * exists).
   * #reset(=name) resets a named counter (or all counters if no name is
   * provided).
   */
  const counter = (function counterMiniModule() {
    /**
     * @return {Object[]} - An object for each counter.
     */
    function getCounters() {
      return access(COUNTER_STORE_NAME);
    }

    /**
     * Add one to the count of an existing counter, or create a new counter
     * starting at 1.
     *
     * @param {string} name - Name of counter to be incremented or created.
     */
    function add(type, flow, level) {
      flow = flow || environment.flowName();
      level = level || environment.taskType();
      util.typeCheck(type, 'string, undefined');
      let counters = getCounters();
      const idx = counters.findIndex(find(flow, level, type));
      if (idx < 0) {
        counters.push({flow, level, type, count: 1});
      } else {
        counters[idx].count++;
      }
      access(COUNTER_STORE_NAME, undefined, {data: counters});
      updateGui({counters: counters});
      return;
    }
    
    /**
     *
     * @param {string} - flow - Current workflow
     * @param {string} - level - Analyst/Reviewer/something else
     * @param {string} - type - Submitted/Skipped/something else
     * @return {boolean} - Does the element match the current counter?
     */
    function find(flow, level, type) {
      return function(counter) {
        return (
          counter.flow === flow &&
          counter.level === level &&
          counter.type === type
        );
      }
    }

    /**
     * @param {string=} name - Name of the counter to find.
     * @return {Object[]} An array of all (matching) counters.
     */
    function get(name) {
      const counters = getCounters();
      if (!name) {
        return [...counters];
      }
      const count = counters.find(find(flow, level, type));
      return (count) ? [count] : [];
    }

    /**
     * @return {string[]} String representations of all counters.
     */
    function getList() {
      return get().map(({flow, level, type, count}) => {
        return `${util.cap.firstLetter(flow)} (${level}) - ${type}: ${count}`;
      });
    }

    /**
     * @param {string=} name - Name of the counter to reset. If no name
     * is provided, all counters are reset.
     */
    function reset(name) {
      if (typeof name !== 'string' && name !== undefined) {
        throw new TypeError('Counter reset expects a name string or nothing');
      }
      let counters = getCounters();
      if (name) {
        if (get(name) < 0) {
          return;
        }
        const idx = counters.findIndex(find(flow, level, type));
        const currentCount = counters[idx].count;
        user.log.counter(
          `Resetting counter ${name} from ${currentCount}`
        );
        counters = counters.splice(idx, 1);
      } else {
        user.log.counter(
          'Resetting all counters:' +
          util.bulletedList(getList())
        );
        counters = [];
      }
      access(COUNTER_STORE_NAME, undefined, {data: counters});
      updateGui({counters: counters});
      return;
    }
    util.wait(1000).then(() => updateGui({counters: getCounters()}));
    return {
      add,
      get,
      getList,
      reset,
    };
  })();
  atest.group('counter', {
    'before': () => 'aG9yc2ViYXR0ZXJ5c3RhYmxl',
    'Undefined counter': (name) => counter.get(name) === -1,
    'Initialised counter': (name) => counter.add(name) === 1,
    'Counter is counting': (name) => counter.add(name) === 2,
    'Counter is consistent': (name) => counter.get(name) === 2,
    'Reset returns 0': (name) => counter.reset(name) === 0,
    'Counter is gone': (name) => counter.get(name) === -1,
  }, true);

  /** Object[] */
  let flaggedIssues = [];

  /**
   * Issue tracker. Integrates updates into a consistent list of currently
   * unresolved issues.
   *
   * @param {Object} issueUpdate - Incoming message. This may refer to a new
   * issue, or update the status of a previous issue.
   * @param {Object} issueUpdate.proxy - HTMLElement proxy.
   * @param {string} issueUpdate.issueType - The type of issue.
   * @param {string} issueUpdate.issueLevel - How critical is this issue?
   * @param {string} issueUpdate.message - Describes the details of the issue.
   * @example
   * {proxy, issueType: 'Typo', issueLevel: 'high', message: 'Wrod misspelled'}
   */
  function flag(issueUpdate) {
    if (issueUpdate && issueUpdate.issueType === 'reset') {
      flaggedIssues.length = 0;
      updateGui({issues: flaggedIssues});
      return;
    }
    if (!issueUpdate || !issueUpdate.proxy || !issueUpdate.issueType) {
      throw new TypeError('Not a valid issue.');
    }
    /**
     * Filter function to remove issues that match the incoming issue.
     * Compares proxy type properties.
     *
     * @param {Object} issue
     */
    const removeMatching = (issue) => {
      const sameproxy = (issue.proxy === issueUpdate.proxy);
      const sameType = (issue.issueType === issueUpdate.issueType);
      return !(sameproxy && sameType);
    };
    /**
     * Filter out issues that without a issueLevel.
     *
     * @param {Object} issue
     */
    const removeOk = (issue => issue.issueLevel !== undefined);
    flaggedIssues = flaggedIssues.filter(removeMatching);
    flaggedIssues.push(issueUpdate);
    flaggedIssues = flaggedIssues.filter(removeOk);
    updateGui({issues: flaggedIssues});
  }
  atest.group('flag', {
    'Fail without an issue': () => atest.throws(() => flag()),
  });

  /**
   * Sets a listener on the document for issue updates.
   */
  function addissueUpdateListener() {
    document.addEventListener('issueUpdate', ({detail}) => {
      flag(detail);
    }, {passive: true});
  }
  addissueUpdateListener();

  /**
  * Object with methods to log events. The following is true for most
  * methods:
  * * @param {Object|string} payload
  * * @param {Object} o
  * * @param {boolean} o.save Should the event be saved to localstorage?
  * * @param {boolean} o.print Should the event be printed to the console?
  */
  const log = (function loggingModule() {

    /**
     * Generate a string from a log entry, in order to print to the console.
     *
     * @param {Object | string} payload - Data associated with the log entry.
     * @return {string}
     */
    function payloadToString(payload) {
      const string = (typeof payload === 'string')
          ? payload
          : JSON.stringify(payload);
      if (typeof payload !== 'string') {
        console.debug('payloadToString received object', payload);
      }
      return (string.length > LOG_ENTRY_MAX_LENGTH)
          ? (string.slice(0, LOG_ENTRY_MAX_LENGTH - 3) + '...')
          : string;
    }

    /**
     * Print a log entry to the console, with a timestamp.
     *
     * @param {string} type
     * @param {Object|string} payload
     * @time {Date=} Optionally, provide a Date for the timestamp.
     * @param {boolean} save - Is this entry being saved?
     * @param {boolean} debug - Use console.debug?
     */
    function printToConsole({
      type, payload,
      time = new Date(),
      save = true,
      debug = false,
    }) {
      const color = LOG_TYPES[type] || NO_COLOR_FOUND;
      const ts = timestamp(time);
      const string = payloadToString(payload)
          .replace(/\n/g, '\n' + ' '.repeat(ts.length + 1));
      console[debug ? 'debug' : 'log'](
        `%c${ts}%c ${string}`,
        TIMESTAMP_STYLE,
        `color: ${color}`
      );
    }

    /**
     * Retrieve an array of all log entries. Timestamps are recast into Date
     * objects.
     *
     * @return {Object[]} Array of entries.
     */
    function getLogbook() {
      const logBook = access(LOGBOOK_STORE_NAME);
      // If the logbook is too long, cut it down.
      if (logBook.length > LOG_MAX_LENGTH) {
        const shorterLogBook = logBook.slice(-LOG_MAX_LENGTH * 0.8);
        access(LOGBOOK_STORE_NAME, undefined, {data: shorterLogBook});
      }
      return logBook.map(entry => {
        const [timestamp, type, payload] = entry;
        const time = new Date(timestamp || 0);
        return {time, type, payload};
      });
    }

    /**
     * Get a filtered part of the persistent log as an array of entries.
     *
     * @param {Object=} filterBy - Filter parameters.
     * @return {Object[]}
     * @example - printPersistent({before: new Date('2019-01-17')});
     */
    function getEntries(filterBy = {}) {
      const filters = {
        after: entry => entry.time > new Date(filterBy.after),
        before: entry => entry.time < new Date(filterBy.before),
        contains: entry => new RegExp(filterBy.contains).test(entry.payload),
        items: entry => true,
        page: entry => true,
        regex: entry => filterBy.regex.test(entry.payload),
        type: entry => entry.type === filterBy.type,
        typeExclude: entry => entry.type !== filterBy.typeExclude,
      };
      let entries = getLogbook();
      for (let filterType in filterBy) {
        try {
          entries = entries.filter(filters[filterType]);
        } catch (e) {
          if (e instanceof TypeError) {
            user.log.warn(
              `'${filterType}' is not a valid log filter.\nPlease use:` +
              util.bulletedList(filters),
              {save: false},
            );
            return [];
          }
        }
      }
      const pageSize = filterBy.items || LOG_PAGE_SIZE;
      const page = (filterBy.page > 0) ? filterBy.page : 0;
      const start = pageSize * (page);
      const end = pageSize * (page + 1);
      entries = entries.slice(-end, -start || undefined);
      return entries;
    }
    atest.group('getEntries', {
      'Get a full page, if possible': () => {
        const entries = getEntries();
        const fullPage = entries.length === LOG_PAGE_SIZE;
        const logTooShort = getLogbook().length < LOG_PAGE_SIZE;
        return fullPage || logTooShort;
      }
    });

    /**
     * Print a filtered part of the persistent log.
     *
     * @param {Object=} filterBy Filter parameters.
     * @return {Object[]}
     * @example print({before: new Date()});
     */
    function print(filterBy = {}) {
      const entries = getEntries(filterBy);
      console.debug('LogEntries: ', entries);
      for (let entry of entries) {
        printToConsole(entry)
      }
    }
    
    document.addEventListener('ttoLog', ({detail}) => {
      if (detail.raw) {
        delete detail.raw;
        console.log(JSON.stringify(getEntries(detail)));
      } else {
        print(detail);
      }
    });

    /**
     * Generate a logging function.
     *
     * @param {string} type - Type of log.
     */
    function genericLog(type) {
      /**
       * @param {string|Object} payload
       * @param {Object} o - Options
       * @param {boolean} o.debug
       * @param {boolean} o.print
       * @param {boolean} o.save
       * @param {boolean} o.toast
       */
      function createEntry(
        payload,
        {
          debug = false,
          print = true,
          save = true,
          toast = true,
        } = {}
      ) {
        if (typeof payload === 'string' &&
            payload.length > LOG_ENTRY_MAX_LENGTH) {
          payload = payload.slice(0, LOG_ENTRY_MAX_LENGTH - 3) + '...';
        }
        if (print || debug) {
          printToConsole({type, payload, save, debug});
        }
        if (save) {
          const newEntry = [new Date().toString(), type, payload];
          access(LOGBOOK_STORE_NAME, undefined, {append: newEntry});
        }
        if (toast) {
          updateGui({toast: payload});
        }
      }
      return createEntry;
    }
    const log = {
      print,
      raw: getEntries,
    }
    for (let type in LOG_TYPES) {
      log[type] = genericLog(type);
    }
    return log;
  })();

  return {
    access,
    config,
    counter,
    log,
  };
})();
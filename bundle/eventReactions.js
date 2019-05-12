var eventReactions = (function eventListenersModule() {
  'use strict';

  /**
   * @fileoverview Sets global event listeners, and exports
   * functions through which functions can be registered.
   * Reaction functions are registered to an HTMLElement and
   * a browser event, and are called when a matching browser
   * event is issued by the matching HTMLElement.
   * This basically emulates setting several event listeners
   * on each HTMLElement.
   */

  /**
   * string[] - The events that can be set on an HTMLElement.
   */
  const SUPPORTED_EVENTS = Object.freeze({
    'onChange': 'change',
    'onClick': 'click',
    'onFocusin': 'focusin',
    'onFocusout': 'focusout',
    'onInteract': 'interact',
    'onKeydown': 'keydown',
    'onInput': 'input',
    'onLoad': 'load',
    'onPaste': 'paste',
  });

  /**
   * string[] - The events that are triggered by the special
   * 'interact' event.
   */
  const INTERACT_EVENTS = Object.freeze([
    'onClick',
    'onInput',
    'onKeydown',
    'onPaste',
  ]);

  const PREVENT_DEFAULT_ON = Object.freeze([
    'Backquote',
    'Backslash',
    'NumpadAdd',
    'NumpadSubtract',
    'NumpadMultiply',
    'NumpadAdd',
    'CtrlEnter',
    'CtrlAltEnter',
    'CtrlNumpadEnter',
    'AltArrowLeft',
    'AltArrowRight',
    'CtrlAltEqual',
  ]);

  /**
   * reactionStore maps HTMLElements to sets of events. Each event maps to
   * an array of reactions. When a browser event is fired by the
   * HTMLElement all matching reactions are returned and called.
   * For example:
   * document.body => {
   *   click: [reaction, reaction],
   *   focusout: [reaction],
   * }
   */
  const reactionStore = (function () {
    const map = new Map();

    /**
     * Get all reaction functions for a given HTML element and an eventType
     * string.
     *
     * @param {Object} o
     * @param {HTMLElement} htmlElement
     * @param {string[]} eventTypes
     * @return {function[]}
     */
    function get({htmlElement, eventTypes}) {
      if (!map.has(htmlElement)) {
        return [];
      }
      if (!Array.isArray(eventTypes)) {
        throw new TypeError('Please provide an array of eventTypes');
      }
      const found = [];
      const reactions = map.get(htmlElement);
      for (let eventType of eventTypes) {
        if (reactions[eventType] !== undefined) {
          found.push(...reactions[eventType]);
        }
      }
      return found;
    }

    /**
     * Get all reaction functions for a given HTML element and an eventType
     * string.
     *
     * @param {Object} o
     * @param {HTMLElement} htmlElement
     * @param {string} eventType
     * @param {function[]}
     * @return {number} The new number of reaction functions now accociated
     * with this HTML element and eventType.
     */
    function set({htmlElement, eventType, functions}) {
      if (!util.isHTMLElement(htmlElement)) {
        throw new TypeError(htmlElement + ' is not an htmlElement');
      }
      if (!Array.isArray(functions)) {
        throw new TypeError('Please provide an array of functions');
      }
      const reactions = map.get(htmlElement) || {};
      const current = get({htmlElement, eventTypes: [eventType]});
      const funcs = [...current, ...functions];
      reactions[eventType] = funcs;
      map.set(htmlElement, reactions);
      return funcs.length;
    }

    function clear() {
      map.clear();
    }

    return {
      get,
      set,
      clear,
    }
  })();

  /**
   * Maps a browser event to a descriptive string, if possible.
   * @param {Event} event - Browser event
   * @return {string}
   * @example A keydown event could map to 'ctrl-c' or 'shift'.
   * 'ctrl-Control' or similar.
   */
  function eventToString(event) {
    if (!event) {
      return '';
    }
    switch (event.type) {
      case 'keydown':
        if (!event.code) { // i.e. synthetic event
          return '';
        }
        let string = '';
        if (event.ctrlKey || event.metaKey) {
          string += 'Ctrl';
        }
        if (event.shiftKey) {
          string += 'Shift';
        }
        if (event.altKey) {
          string += 'Alt';
        }
        if (![
          'ControlLeft', 'ControlRight',
          'ShiftLeft', 'ShiftRight',
          'AltLeft', 'AltRight',
          'MetaLeft', 'MetaRight',
        ].includes(event.code)) {
          string += event.code.replace('Key', '');
        }
        // Mac handles Delete/Backspace differently
        return string.replace('AltBackspace', 'Delete');
      default:
        return '';
    }
  }
  atest.group('eventToString', {
    'onKeydown': () => {
      return eventToString({
        type: 'keydown',
        code: 'KeyA',
      }) === 'A';
    },
    'onKeydown_CtrlA': () => {
      return eventToString({
        type: 'keydown',
        ctrlKey: true,
        code: 'KeyA',
      }) === 'CtrlA';
    },
    'onKeydown_CtrlShiftAltA': () => {
      return eventToString({
        type: 'keydown',
        shiftKey: true,
        ctrlKey: true,
        altKey: true,
        code: 'KeyA',
      }) === 'CtrlShiftAltA';
    },
    'onKeydown_CtrlShiftAltA': () => {
      return eventToString({
        type: 'keydown',
        ctrlKey: true,
        code: 'Enter',
      }) === 'CtrlEnter';
    },
    'onClick': () => {
      return eventToString({
        type: 'click',
      }) === '';
    },
  });

  /**
   * Maps a browser event to two descriptive strings, if possible.
   * @param {Event} event - Browser event
   * @return {string[]}
   * @example:
   * A click event may be converted to ['click', 'click_'].
   * @example:
   * A keydown event may be converted to ['keydown', 'keydown_CtrlA'].
   */
  function eventToEventTypes(event) {
    const eventString = eventToString(event);
    const type = 'on' + event.type.replace(/./,(d) => d.toUpperCase());
    const type_k = `${type}_${eventString}`;
    return [type, type_k];
  }
  atest.group('eventToEventTypes', {
    'onKeydown[0]': () => {
      return eventToEventTypes({
        type: 'keydown',
      })[0] === 'onKeydown';
    },
    'onKeydown_CtrlA[0]': () => {
      return eventToEventTypes({
        type: 'keydown',
        ctrlKey: true,
        code: 'KeyA',
      })[0] === 'onKeydown';
    },
    'onKeydown_CtrlA[1]': () => {
      return eventToEventTypes({
        type: 'keydown',
        ctrlKey: true,
        code: 'KeyA',
      })[1] === 'onKeydown_CtrlA';
    },
    'onKeydown_CtrlShiftAltA[1]': () => {
      return eventToEventTypes({
        type: 'keydown',
        shiftKey: true,
        ctrlKey: true,
        altKey: true,
        code: 'KeyA',
      })[1] === 'onKeydown_CtrlShiftAltA';
    },
  });

  /**
   * Run an array of functions without blocking.
   * @param {function[]} functions.
   */
  function runAll(...functions) {
    for (let func of functions) {
      if (typeof func === 'function') {
        util.wait().then(func);
      } else {
        throw new TypeError('Not a function.');
      }
    }
  }
  atest.group('runAll', {
    'Run 3 functions': async () => {
      let count = 0;
      const increment = () => count++;
      runAll(increment, increment, increment);
      await util.wait();
      return count === 3;
    },
    'Throw unless all functions': async () => {
      let count = 0;
      const increment = () => count++;
      return atest.throws(() => {
        runAll(increment, increment, 3, increment);
      });
    },
    'Fail if input is an array': async () => {
      let count = 0;
      const increment = () => count++;
      return atest.throws(() => {
        runAll([increment, increment, increment]);
      });
    },
  });

  /**
   * Wrap reaction functions so that the reaction function is receive
   * important context.
   *
   * @param {function[]} functions - Reaction functions
   * @param {Object} o
   * @param {Object} o.proxy - Which proxy triggered the event.
   * @param {number} o.idx - The index of the proxy
   * @param {Object[]} o.group - All proxies in this group.
   */
  function addContext(functions, {proxy, idx, group}) {
    return util.alwaysArray(functions).map(func => {
      const run = util.debounce(func);
      return () => run(proxy, idx, group);
    });
  }
  atest.group('addContext', {
    'Context added to functions': async () => {
      const func = (a, b, c) => a + b + c;
      const context = {proxy: 1, idx: 2, group: 3};
      const withContext = addContext(func, context)[0];
      await util.wait();
      return withContext() === 6;
    },
  });

  /**
   * Process raw reactions objects:
   * * Handle the onLoad event (by running these reactions).
   * * Handle the onInteract event (by assigning these reactions to several
   *   other event).
   * * Wrap all reactions in the relevant context (proxy, idx, group).
   */
  function unpackAndAddContext(reactions, context) {
    if (!reactions || !context) {
      throw new TypeError('Reactions object and context are required.');
    }
    const cloneReaction = {...reactions};
    for (let eventType in cloneReaction) {
      cloneReaction[eventType] =
          addContext(
            cloneReaction[eventType],
            context,
          );
    }
    if (cloneReaction.onInteract) {
      for (let eventType of INTERACT_EVENTS) {
        const current = cloneReaction[eventType] || [];
        const onInteract = cloneReaction.onInteract;
        cloneReaction[eventType] = [...current, ...onInteract];
      }
      delete cloneReaction.onInteract;
    }
    if (cloneReaction.onLoad) {
      runAll(...cloneReaction.onLoad);
      delete cloneReaction.onLoad;
    }
    const filteredClone = {};
    for (let eventType in cloneReaction) {
      if (/^on/.test(eventType)) {
        filteredClone[eventType] = cloneReaction[eventType];
      }
    }
    return filteredClone;
  }
  atest.group('unpackAndAddContext', {
    'before': () => {
      return {
        name: 'Name',
        onLoad: () => {},
        onClick: () => {},
        onInteract: () => {},
      };
    },
    'onLoad removed': (reactions) => {
      const ret = unpackAndAddContext(reactions, {});
      return ret.onLoad === undefined;
    },
    'onClick added': (reactions) => {
      const ret = unpackAndAddContext(reactions, {});
      return ret.onClick.length === 2;
    },
    'Name removed': (reactions) => {
      const ret = unpackAndAddContext(reactions, {});
      return ret.name === undefined;
    },
  });

  /**
   * For an HTMLElement, attach additional reaction functions.
   *
   * @param {htmlElement} htmlElement - The element to which
   * the reactions should be attached.
   * @param {Object<string: function[]>} reactions - A
   * map of event types to arrays of functions.
   * @param {Object} - Context about the way in which the
   + functions should be invoked, i.e. what group of proxies
   * these reactions were attached to and which one triggered
   * the functions.
   */
  function set(htmlElement, reactions, context) {
    if (!util.isHTMLElement(htmlElement)) {
      throw new TypeError('Not an HTMLElement');
    }
    const formattedReactions = unpackAndAddContext(reactions, context);
    for (let reaction in formattedReactions) {
      reactionStore.set({
        htmlElement: htmlElement,
        eventType: reaction,
        functions: formattedReactions[reaction],
      });
    }
  }

  /**
   * Attach additional reaction functions to the document.
   *
   * @param {Object<string: function[]>} reactions - A
   * map of event types to arrays of functions.
   */
  function setGlobal(reactions) {
    eventReactions.set(document, reactions, {proxy: {}, idx: 0, group: []});
  }

  /**
   * For a given browser event, find all relevant reaction functions.
   *
   * @param {Event} event - Browser event.
   * @return {function[]} Reaction functions.
   */
  function getMatchingReactions(event) {
    const elementReactions = reactionStore.get({
      htmlElement: event.target,
      eventTypes: eventToEventTypes(event),
    });
    const globalReactions = reactionStore.get({
      htmlElement: document,
      eventTypes: eventToEventTypes(event),
    });
    return [...elementReactions, ...globalReactions];
  }

  function maybePreventDefault(event) {
    const string = eventToString(event);
    if (PREVENT_DEFAULT_ON.includes(string)) {
      event.preventDefault();
    } else if (event.code) {
    }
  }

  /**
   * Respond to document level browser events.
   * Request matching reactions to events and run them.
   *
   * @param {Event} - Browser event.
   */
  function genericEventHandler(event) {
    maybePreventDefault(event);
    const targetReactions = getMatchingReactions(event);
    runAll(...targetReactions);
  }

  /**
   * Initialise document level event handlers.
   */
  function initGenericEventHandlers() {
    for (let type in SUPPORTED_EVENTS) {
      if (type === 'onLoad' || type === 'onInteract') {
        continue;
      }
      const eventType = SUPPORTED_EVENTS[type];
      document.addEventListener(
        eventType,
        genericEventHandler,
      );
    }
  }

  initGenericEventHandlers();
  return {
    reset: reactionStore.clear,
    set,
    setGlobal,
    SUPPORTED_EVENTS,
  }
})();
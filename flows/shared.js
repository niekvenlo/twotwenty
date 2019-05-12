'use strict';

var shared = (function workflowMethodsModule() {

  /**
   * @fileoverview Methods to be shared between flows.
   */

  const ALERT_LEVELS = ['high', 'medium', 'low'];
  
  /**
   * Show a quick toast message.
   *
   * @param {string} msg
   */
  function toast(msg) {
    user.log.low(
      msg,
      {debug: false, save: false, print: false, toast: true},
    );
  }
  
  /**
   * Change the value of a proxy under certain conditions.
   *
   * @param {Object} o
   * @param {string} o.to - String to set the value to.
   * @param {Function} o.through - Function to modify the value with.
   * @param {string} o.andToast - Message to show.
   * @param {Function} o.when - Function to determine whether to change
   * the value.
   * @param {boolean} o.is - Should the value change if the when function
   * returns true?
   */
  function change({
    to = 'Error',
    through = (a) => to,
    andToast = '',
    when = () => false,
    is = true,
  }) {
    util.typeCheck(to, 'string');
    util.typeCheck(through, 'function');
    util.typeCheck(andToast, 'string');
    util.typeCheck(when, 'function');
    util.typeCheck(is, 'boolean');
    return async function (proxy) {
      if (await when(proxy.value) === is) {
        proxy.value = through(proxy.value);
        if (andToast) {
          toast(andToast);
        }
      }
    }
  }

  /**
   * Report an issue on a proxy under certain conditions.
   *
   * @param {Object} o
   * @param {string} o.level - Issue level to report.
   * @param {string} o.type - Type of the issue.
   * @param {string} o.message - Message to attack to the issue.
   * @param {string} o.andToast - Message to show.
   * @param {Function} o.when - Function to determine whether to change
   * the value.
   * @param {boolean} o.is - Should the value change if the when function
   * returns true?
   */
  function report({
    level = 'high',
    type,
    message = '',
    andToast,
    when = () => false,
    is = true,
  }) {
    if (!ALERT_LEVELS.includes(level)) {
      throw new RangeError(
        level + ' is not a known issueLevel. Please use:' +
        util.bulletedList(ALERT_LEVELS)
      );
    }
    util.typeCheck(andToast, 'string, undefined');
    util.typeCheck(when, 'function');
    util.typeCheck(is, 'boolean');
    return async function(proxy, idx, group) {
      const ret = await when(proxy.value, idx, group);
      if (typeof ret !== 'boolean') {
        message = ret;
      }
      const flag = new Boolean(ret) == is;
      const packet = {
        proxy,
        issueType: type,
        message: message || proxy.value,
        issueLevel: (flag) ? level : undefined,
      };
      util.dispatch('issueUpdate', packet);
      if (flag && andToast) {
        toast(andToast);
      }
    }
  }

  /**
   * Add Brand™ capitalisation to a string.
   */
  function brandCapitalisation(value) {
    const brands = user.access('BrandCapitalisation');
    let tmpValue = value;
    for (let brand of brands) {
      tmpValue = tmpValue.replace(new RegExp(brand, 'gi'), brand);
    }
    return tmpValue;
  }
  atest.group('brandCapitalisation', {
    'iPhone': async () => {
      await util.wait(100);
      return brandCapitalisation('Iphone') === 'iPhone';
    },
    'Word': async () => {
      await util.wait(100);
      return brandCapitalisation('Word') === 'Word';
    },
  });

  /**
   * Simplifies common changes to the comment box.
   *
   * @ref {finalCommentBox}
   */
  const comment = (function commentMiniModule() {
    let string = '';
    function getCommentBox() {
      const commentBox = ref.finalCommentBox && ref.finalCommentBox[0];
      if (!commentBox || !commentBox.focus) {
        throw new Error('Comment box not found');
      }
      return commentBox;
    }
    function addInitials(additional) {
      string = additional + '\n';
      const commentBox = getCommentBox();
      commentBox.focus();
      commentBox.scrollIntoView();
      const initials = user.config.get('initials') || '';
      if (new RegExp('^' + initials).test(commentBox.value)) {
        return;
      }
      const msg = (additional) ? additional + '\n' : '';
      commentBox.value = `${initials}\n${msg}${commentBox.value}`;
    }
    function focus() {
      const commentBox = getCommentBox();
      commentBox.focus();
      commentBox.scrollIntoView();
    }
    function removeInitials() {
      const commentBox = getCommentBox();
       const initials = user.config.get('initials') || '';
       const regex = new RegExp('^' + initials + '\n');
       commentBox.value =
           commentBox.value.replace(regex, '').replace(string, '');
    }
    let statusType = '';
    function setStatus(newType) {
      if (statusType === newType) {
        return;
      }
      const commentBox = getCommentBox();
      const matchStatusOrEnd = new RegExp(statusType + '|$');
      commentBox.value =
          commentBox.value.replace(matchStatusOrEnd, newType || '');
      statusType = newType;
    }
    return {
      addInitials,
      focus,
      removeInitials,
      setStatus,
    };
  })();
  atest.group('comment', {
    'before': async () => {
      await util.wait(100);
      const tmp = ref.finalCommentBox;
      const initials = user.config.get('initials');
      const fakeBox = {
          value: 'user comment',
          focus: () => {},
          scrollIntoView: () => {},
        }
      ref.finalCommentBox = [fakeBox];
      return {tmp, initials};
    },
    'after': (o) => ref.finalCommentBox = o.tmp,
    'Add initials': (o) => {
      comment.addInitials();
      return ref.finalCommentBox[0].value.includes(o.initials);
    },
    'Remove initials': (o) => {
      comment.addInitials();
      comment.removeInitials();
      return !ref.finalCommentBox[0].value.includes(o.initials);
    },
    'Set status': (o) => {
      comment.setStatus('test');
      return ref.finalCommentBox[0].value.includes('test');
    },
    'Change status': (o) => {
      comment.setStatus('test');
      comment.setStatus('changed');
      const value = ref.finalCommentBox[0].value;
      return value.includes('changed') && !value.includes('test');
    },
  });
  
  /**
   * Report an issue if capitalisation does not conform.
   *
   * @param {Object} proxy
   * @todo Make 'change' function.
   */
  function checkCapitals(proxy) {
    const keepCaps = user.config.get('keep original capitalisation');
    if (keepCaps) {
      return;
    }
    const packet = {proxy, issueType: 'Unusual capitalisation'};
    const looksCorrect = (string) => {
      const brands = user.access('BrandCapitalisation');
      const firstWord = string.split(' ')[0]
      const firstLetter = string[0] || 'X';
      for (let brand of brands) {
        if (new RegExp('^' + brand, 'i').test(firstWord)) {
          if (new RegExp('^' + brand).test(firstWord)) {
            return true;
          }
          return false;
        }
      }
      return firstLetter === firstLetter.toUpperCase();
    };
    if (!looksCorrect(proxy.value)) {
      packet.issueLevel = 'medium';
      packet.message =`Check capitalisation of '${proxy.value}' in ${proxy.name}`;
    }
    util.dispatch('issueUpdate', packet);
  }

  /**
   * Locally disable browser spellcheck on specified elements.
   *
   * @param {Object} _ - Ignored
   * @param {number} __ - Ignored
   * @param {Objec[]} group - Array of proxies.
   */
  function disableSpellcheck(_, __, group) {
    for (let proxy of group) {
      proxy.spellcheck = false;
    }
  }

  /**
   * Raise an issue if the creative contains no text.
   *
   * @param {Object} proxy
   * @param {number} _
   * @param {Object[]} group
   */
  function checkEmptyCreative(proxy, _, group) {
    const packet = {proxy, issueType: 'Empty creative'};
    if (group.every(el => !el.textContent)) {
      packet.issueLevel = 'medium';
      packet.message = 'Creative is empty';
    }
    util.dispatch('issueUpdate', packet);
  }
  checkEmptyCreative = util.debounce(checkEmptyCreative);
  
  /** SL/SS */
  const item = (function itemMiniModule() {
    /**
     *
     */
    function focus(idx, num = 0) {
      util.attention(ref['addDataButton' + num], 0, 'click'),
      util.attention(ref['editButton' + num], 0, 'click, scrollIntoView');
      util.attention(ref['extractionUrl' + num], 0, 'scrollIntoView');
      return util.attention(ref['textAreas' + num], idx, 'focus');
    }

    /**
     * Move the focus to the prior proxy in the group, if possible.
     * When moving out of an empty box, mark the corresponding item
     * as 'Leave Blank'.
     *
     * @param {Object} _
     * @param {number} idx
     * @param {Object[]} group
     */
    function moveLeft(idx, num = 0) {
      if (idx < 1) {
        return;
      }
      const text = ref['textAreas' + num];
      if (text[idx].value === '') {
        util.attention((ref['leaveBlank' + num] || []).slice(-3), idx - 2, 'click');
      }
      util.attention(text, idx - 1, 'focus');
    }
    
    /**
     * Move the focus to the next proxy in the group, if possible.
     * When moving into an empty box, mark the corresponding item
     * as 'Add Item'.
     *
     * @param {Object} _
     * @param {number} idx
     * @param {Object[]} group
     */
    function moveRight(idx, num = 0) {
      if (idx > 5) {
        return;
      }
      const text = ref['textAreas' + num];
      if (text[idx + 1] && text[idx + 1].disabled) {
        util.attention((ref['addItem' + num] || []).slice(-3), idx - 1, 'click');
      }
      util.attention(text, idx + 1, 'focus');
    }

    /**
     * Swap the values of the currently selected item with the item to
     * the left, if possible.
     *
     * @param {Object} _
     * @param {number} idx
     * @param {Object[]} group
     * @ref {textAreas0}
     * @ref {linkAreas0}
     * @ref {screenshots0}
     */
    function swapLeft(idx, num = 0) {
      const text = ref['textAreas' + num];
      const link = ref['linkAreas' + num];
      const screenshot = ref['screenshots' + num];
      if (idx < 1) {
        return;
      }
      text && util.swapValues(text[idx], text[idx - 1]);
      link && util.swapValues(link[idx], link[idx - 1]);
      screenshot && util.swapValues(screenshot[idx], screenshot[idx - 1]);
      text && text[idx - 1].focus();
      user.log.ok('Swapped items', {print: false, save: false});
    }

    /**
     * Swap the values of the currently selected item with the item to
     * the right, if possible. Does not swap with disabled items.
     *
     * @param {Object} _
     * @param {number} idx
     * @ref {textAreas0}
     * @ref {linkAreas0}
     * @ref {screenshots0}
     */
    function swapRight(idx, num = 0) {
      const text = ref['textAreas' + num];
      const link = ref['linkAreas' + num];
      const screenshot = ref['screenshots' + num];
      if (idx > 4 || text[idx + 1].disabled) {
        return;
      }
      text && util.swapValues(text[idx], text[idx + 1]);
      link && util.swapValues(link[idx], link[idx + 1]);
      screenshot && util.swapValues(screenshot[idx], screenshot[idx + 1]);
      text && text[idx + 1].focus();
      user.log.ok('Swapped items', {print: false, save: false});
    }
    
    /**
     * Remove the values of the currently selected item.
     *
     * @param {Object} _
     * @param {number} idx
     * @ref {textAreas0}
     * @ref {linkAreas0}
     * @ref {screenshots0}
     */
    function remove(idx, num = 0) {
      const text = ref['textAreas' + num];
      const link = ref['linkAreas' + num];
      const screenshot = ref['screenshots' + num];
    
      text && (text[idx].value = '');
      link && (link[idx].value = '');
      screenshot && (screenshot[idx].value = '');
      text && text[idx].focus();
      user.log.ok('Removed item', {print: false, save: false});
    }
    
    function removeAll() {
      util.attention(ref.editButton0, 0, 'click'); // @todo For ss open the others
      for (let num in [0,1,2]) {
        for (let idx in [0,1,2,3,4]) {
          remove(idx, num);
        }
      }
    }
    return {
      focus,
      moveLeft,
      moveRight,
      swapLeft,
      swapRight,
      remove,
      removeAll,
    }
  })();

  
  /**
   *
   */
  function getScreenshotText() {
    if (!environment.isAnalystTask() || !ref.screenshots0) {
      return '';
    }
    const screenshots = [
      ...ref.screenshots0,
      ...(ref.screenshots1 || []),
      ...(ref.screenshots2 || []),
    ].map(ss => ss.value).filter(ss => /^http/.test(ss));
    return [...new Set(screenshots)].join('\n');
  }
  
  /**
   * Extract links from Analyst comment and map to pseudo-proxies.
   *
   * @return {Object[]}
   */
  function getLinksFromComment() {
    const commentScreenshots = [];
    if (ref.analystComment && ref.analystComment[0]) {
      const commentLinks =
          ref.analystComment[0]
          .textContent.match(/http[^\s,]*/g);
      if (commentLinks) {
        const commentObjects = commentLinks.map(link => ({value: link}));
        commentScreenshots.push(...commentObjects);
      }
    }
    return commentScreenshots;
  }

  /**
   * Dispatch a guiUpdate.
   *
   * @param {string} message
   */
  function guiUpdate(message) {
    util.dispatch('guiUpdate', {toast: message, stage: message});
  }

  /**
   * Touches HTMLElements to keep the current task alive.
   * Function is called on a group of elements, but only runs once.
   * Periodically picks a random element from the group, and touches it.
   *
   * @param {Object} _ - Proxy object. Ignored.
   * @param {number} __ - Element idx. Ignored.
   * @param {Object[]} group - Array of proxies to touch.
   */
  async function keepAlive(_, __, group) {
    const MINUTES = 30;
    const INTERVAL = 30000; // ms
    const times = (MINUTES * 60000) / INTERVAL;
    for (let i = 0; i < times; i++) {
      await util.wait(INTERVAL);
      const idx = Math.floor(Math.random() * group.length);
      group[idx].touch();
    }
  }
  keepAlive = util.debounce(keepAlive);

  /**
   * Opens/closes tabs based on urls on the page. Opens new tabs based on unique
   * link values in ref.openInTabs. Order of tabs is determined by ref.openInTabs.
   *
   * #close Close all currently opened tabs.
   * #open Opens all unique links.
   * #refresh Closes all currently opened tabs, then opens all unique links.
   * @ref {ref.openInTabs}
   */
  const manageTabs = (function tabsMiniModule() {
    function send(urls) {
      const preface = 'https://www.google.com/evaluation/ads/beta/'
        + 'rating/gwt/../redirect?a=true&q=';
      urls = (user.config.get('use google links'))
          ? urls.map(url => preface + encodeURIComponent(url))
          : urls;
      urls = [...new Set(urls)];
      if (!chrome.runtime) {
        user.log.warn('Please reload EWOQ');
        return;
      }
      chrome.runtime.sendMessage(urls);
    }
    function open(urls) {
      send(urls);
    }
    function close(urls) {
      if (user.config.get('use dual monitor mode')) {
        send(['about:blank']);
      } else {
        send([]);
      }
    }
    return {
      open,
      close,
      refresh: open,
    }
  })();

  /**
   * Tests whether all proxies in a group have the same domain.
   *
   * @param {Object} _ - Unused parameter. The triggering proxy.
   * @param {number} __ - Unused parameter. The index of the triggering proxy.
   * @param {Object[]} group - Array of proxies to check for mismatching
   * domains.
   */
  function noDomainMismatch(_, __, group) {
    const japan = (url) => {
      const secondLevel = [
        '.ac.jp',
        '.ad.jp',
        '.co.jp',
        '.ed.jp',
        '.go.jp',
        '.gr.jp',
        '.lg.jp',
        '.ne.jp',
        '.or.jp',
      ];
      let newUrl = url;
      for (let one of secondLevel) {
        newUrl = newUrl.replace(one, '.jp');
      }
      return newUrl;
    }
    const getTrimmedDomain = (url) => {
      const domain = util.getDomain(url).toLowerCase();
      const n = (/co.uk|co.jp/.test(url)) ? 3 : 2;
      return japan(domain.split('.').slice(-n).join('.'));
    };
    const lpDomain = getTrimmedDomain(group.slice(-1)[0].value);
    const mismatch = [];
    for (let proxy of group) {
      const proxyDomain = getTrimmedDomain(proxy.value);
      if (lpDomain && proxyDomain && (lpDomain !== proxyDomain)) {
        mismatch.push(proxy);
      }
    }
    for (let proxy of group) {
      const packet = {proxy, issueType: 'Domain mismatch'};
      if (mismatch.includes(proxy)) {
        packet.issueLevel = 'medium';
        const trimmed = getTrimmedDomain(proxy.value);
        packet.message =`'${trimmed}'`;
      }
      util.dispatch('issueUpdate', packet);
    }
  }

  /**
   * Tests whether any proxies in a group have the same value, and flags
   * proxies that repeat previous values.
   *
   * @param {Object} _ - Unused parameter. The triggering proxy.
   * @param {number} __ - Unused parameter. The index of the triggering proxy.
   * @param {Object[]} group - Array of proxies to check for duplicate values.
   */
  function noDuplicateValues(group, getText) {
    const values = [];
    const dupes = [];
    const packets = [];
    for (let proxy of group) {
      const value = getText(proxy);
      if (values.includes(value)) {
        dupes.push(value);
      }
      if (value !== '') {
        values.push(value);
      }
    }
    for (let proxy of group) {
      const value = util.normaliseUrl(getText(proxy));
      let packet = {proxy, issueType: 'Duplicate'};
      if (dupes.includes(value)) {
        packet.issueLevel = 'high';
        packet.message = `'${value}'`;
      }
      packets.push(packet);
      if (value) {
        values.push(value);
      }
    }
    for (let packet of packets) {
      util.dispatch('issueUpdate', packet);
    }
    return packets;
  }
  noDuplicateValues = util.delay(noDuplicateValues, 100);

  /**
   * Tests whether any proxies in a group have the same first word, and flags
   * proxies that repeat first words.
   *
   * @param {Object} _ - Unused parameter. The triggering proxy.
   * @param {number} __ - Unused parameter. The index of the triggering proxy.
   * @param {Object[]} group - Array of proxies to check for duplicate words.
   */
  function noDuplicateVerbs(_, __, group) {
    const firstWords = [];
    const dupes = [];
    for (let proxy of group) {
      const firstWord = proxy.value.split(' ')[0];
      if (firstWords.includes(firstWord)) {
        dupes.push(proxy);
      }
      firstWord && firstWords.push(firstWord);
    }
    for (let proxy of group) {
      const packet = {proxy, issueType: 'Repeated verb'};
      if (dupes.includes(proxy)) {
        packet.issueLevel = 'low';
        packet.message = `First word repeated: '${proxy.value.split(' ')[0]}'`;
      }
      util.dispatch('issueUpdate', packet);
    }
    noDuplicateVerbsJapanese(_, __, group);
  }
  
  /**
   * Tests whether any proxies in a group have the same Japanese verb, from a
   * short list of verbs, and flags proxies that repeat verbs.
   *
   * @param {Object} _ - Unused parameter. The triggering proxy.
   * @param {number} __ - Unused parameter. The index of the triggering proxy.
   * @param {Object[]} group - Array of proxies to check for duplicate words.
   */
  function noDuplicateVerbsJapanese(_, __, group) {
    const verbs = ['見る', '探す', 'する', '選ぶ','検索'];
    const foundVerbs = [];
    const duplicateProxies = [];
    for (let proxy of group) {
      for (let verb of verbs) {
        if (proxy.value.includes(verb)) {
          if (foundVerbs.includes(verb)) {
            duplicateProxies.push(proxy);
          }
          foundVerbs.push(verb);
          console.log('found a verb: ', verb);
        }
      }
    }
    for (let proxy of group) {
      const packet = {proxy, issueType: 'Repeated Japanese verb'};
      if (duplicateProxies.includes(proxy)) {
        packet.issueLevel = 'low';
        packet.message = `Verb repeated: '${proxy.value}'`;
      }
      util.dispatch('issueUpdate', packet);
    }
  }

  /**
   * Pops up a confirmation dialog. On confirmation, will reset all counters.
   */
  async function resetCounter() {
    const counterList = util.bulletedList(user.counter.getList());
    const question = (counterList)
        ? 'Please confirm.\nAre you sure you want to reset all counters?' +
            counterList
        : 'Nothing to reset. No counters set';
    user.log.notice(question, {toast: true});
    await util.wait();
    if (confirm(question)) {
      user.counter.reset();
    } else {
      toast('Canceled');
    }
  }

  /**
   * Skip the current task.
   * Currently takes no parameters but could be rewritten to override the
   * locations of the buttons in the DOM.
   */
  async function skipTask() {
    const RETRIES = 100;
    const DELAY = 50; // ms
    const flowName = environment.flowName();
    const taskType = environment.taskType();

    const confirmButtonSelector = {
      name: 'Confirm Skip',
      select: '.gwt-SubmitButton',
      pick: [0],
    };

    function clickConfirm() {
      const button = ー(confirmButtonSelector)[0];
      if (button) {
        button.click();
        const creativeUrl =
            ref.creative&& ref.creative[1] && ref.creative[1].textContent;
        const taskId = environment.taskId().decoded.match(/.{1,41}/g).join('\n');
        user.log.skip(`Skipping task\n${creativeUrl}\n${taskId}`);
        user.counter.add('Skipped', flowName, taskType);
        return true;
      }
      return false;
    }

    const skipButton = ref.skipButton && ref.skipButton[0];
    if (!skipButton) {
      user.log.warn('Skip button not found.');
      return;
    }
    skipButton.click();
    await util.retry(clickConfirm, RETRIES, DELAY, true)();
    util.dispatch('issueUpdate', {issueType: 'reset'});
    manageTabs.close();
  }

  /**
   * Set the current task status, by changing the values in the
   * dropdown menus.
   *
   * @param {string} type
   * @ref {statusDropdown}
   * @ref {editButton0}
   * @ref {addDataButton0}
   * @ref {extractionUrl0}
   * @ref {invalidScreenshot}
   * @ref {canOrCannotExtractButtons}
   */
  function setStatus(type) {
    const keys = {
      'canExtract':    [0, 2, 0],
      'insufficient':  [1, 2, 1],
      'pageError':     [1, 2, 2],
      'dynamic':       [1, 2, 4],
      'geo':           [1, 2, 3],
      'nonLocale':     [1, 2, 5],
      'supernatural':  [1, 2, 10],
      'pII':           [1, 2, 12],
      'drug':          [1, 2, 16],
      'other':         [1, 2, 0],
      'drugDomain':    [4, 1, 3],
      'alcoholDomain': [4, 1, 4],
      'adultDomain':   [4, 1, 6],
      'gambling':      [4, 1, 5],
      'emptyCreative': [1, 2, 0, 'Creative Not Available/Comprehendable'],
      'urlsUnchanged': [1, 2, 0, 'URLs Not Changing/Tabs On Same Page'],
      'urlMismatch':   [1, 2, 0, 'Visible URL/LP URL Mismatch'],
    };
    if (!ref.statusDropdown) {
      throw new Error('No status dropdown menus selected.');
    }
    function clickAndFocus(type) {
      const n = (type === 'canExtract') ? 0 : 1;
      util.attention(ref.canOrCannotExtractButtons, n, 'click');
      if (type === 'canExtract') {
        util.attention(ref.editButton0, 0, 'click');
        util.attention(ref.addDataButton0, 0, 'click, scrollIntoView');
        item.focus(1);
        if (ref.extractionUrl0 && ref.finalUrl && !ref.extractionUrl0[0].value) {
          ref.extractionUrl0[0].value = ref.finalUrl[0].value;
        } else {
          util.attention(ref.extractionUrl0, 0, 'focus');
        }
      } else {
        util.attention(ref.invalidScreenshot, 0, 'focus');
      }
    }
    async function setTo() {
      if (!keys[type]) {
        return user.log.warn('Invalid status type: ' + type);
      }
      const [b, c, d, message] = keys[type] || [];
      const dropdowns = ref.statusDropdown;
      dropdowns[0].value = b;
      dropdowns[c].value = d;
      clickAndFocus(type);
      shared.comment.setStatus(message);
    }
    return setTo;
  }

  /**
   * Attempt to submit the task.
   * @param {string} msg - Message to append to the log. Context.
   */
  async function submit(msg) {
    const flowName = environment.flowName();
    const taskType = environment.taskType();
    const button = ref.submitButton && ref.submitButton[0];
    if (!button) {
      throw new TypeError('Submit requires a valid submit button proxy');
    }
    if (button.disabled) {
      user.log.warn('EWOQ is not ready to submit');
      return false;
    }
    const taskId =
      (environment.taskId().decoded.match(/.{1,41}/g) || []).join('\n');
    guiUpdate('Submitting');
    let valve = 0;
    while (button.disabled && valve++ < 100) {
      await util.wait(40);
    }
    if (valve > 100) {
      if (document.querySelector('.EGKJNJB-d-Db')) {
        util.attention(ref.editButton0, 0, 'click');
        user.log.warn('EWOQ has a network issue');
      } else {
        user.log.warn('EWOQ is not ready anymore');
      }
      return false;
    }
    user.log.submit(`Submitting task\n${msg}\n${taskId}`);
    button.click();
    guiUpdate('Submitted');
    util.dispatch('issueUpdate', {issueType: 'reset'});

    user.counter.add('Submitted', flowName, taskType);

    if (user.config.get('keep tabs open until submitting')) {
      shared.manageTabs.close();
    }
    
    return true;
  }
  submit = util.delay(util.debounce(submit, 100), 100);

  const tabOrder = (function tabOrderMiniModule() {
    /**
     * Set the tabIndex of a proxy to 0, making it tabbable.
     *
     * @param {Object} proxy
     */
    function add(proxy) {
      proxy.tabIndex = 0;
    }
    /**
     * Set the tabIndex of a group of proxies, sequentially, making
     * them tabbable in order.
     *
     * @param {Object} proxy. Ignored
     * @param {number} idx. Ignored
     * @param {Object[]} group
     */
    function set(_, __, group) {
      for (let idx in group) {
        group[idx].tabIndex = idx + 1;
      }
    }
    set = util.debounce(set);

    /**
     * Set the tabIndex of a proxy to -1, making it untabbable.
     *
     * @param {Object} proxy
     */
    function remove(proxy) {
      proxy.tabIndex = -1;
    }
    return {
      add,
      set,
      remove,
    }
  })();

  /**
   * Toggle the value of a Yes/No select HTMLElement.
   */
  function toggleSelectYesNo(proxy) {
    const options = ['YES', 'NO'];
    const idx = options.findIndex((option) => option === proxy.value);
    if (idx < 0) {
      throw Error('Cannot toggle: ' + proxy.value);
    }
    proxy.value = options[(idx + 1) % 2];
    proxy.blur();
  }

  /**
   * Count the number of characters in a textbox and write that number
   * to a text span.
   *
   * @param {Object[]} group - Group consisting of a textarea and a span.
   */
  function updateCharacterCount(_, __, group) {
    const count = group[0].value.length;
    const characters = count === 1 ? 'character' : 'characters';
    group[1].textContent =
        `You have used ${count || 'no'} ${characters}`;
    const limit = (user.config.get('12 character limit')) ? 12 : 25;
    if (count <= limit) {
      group[1].css = {color: 'black'};
    } else if (count < 51) {
      group[1].css = {color: '#872b20'};
    } else {
      group[1].css = {color: '#dd4b39'};
    }
  }
  updateCharacterCount = util.delay(updateCharacterCount);

  const reportOrChange = {
    addDashes: change({
      to: '---',
      when: (value) => /^$/.test(value),
      is: true,
    }),
    
    noHomepageLinks: report({
      level: 'medium',
      type: 'Link looks like a homepage',
      andToast: 'This link looks like a homepage',
      when: (value) => /https?:\/\/[^\/]*(\/[?#]*)?$/.test(value),
      is: true,
    }),
    
    noMalformedLinks: report({
      level: 'high',
      type: 'Link looks broken',
      andToast: 'This link looks broken',
      when: (value) => /.https?:\/\//.test(value),
      is: true,
    }),

    noMoreThan25Chars: report({
      level: 'high',
      type: 'Too many characters',
      andToast: 'Too many characters',
      when: (value) => value.length > 25,
      is: true,
    }),

    noMoreThan12Chars: report({
      level: 'high',
      type: 'Too many characters',
      andToast: 'Too many characters',
      when: (value) => value.length > 12,
      is: true,
    }),

    noMoreThanXChars: report({
      level: 'high',
      type: 'Too many characters',
      andToast: 'Too many characters',
      when: (value) => {
          // Removing Katakana
        const japaneseRegex = new RegExp(
          '[\u3000-\u303F]|[\u3040-\u309F]|' +
          '[\uFF00-\uFFEF]|' +
          '[\u4E00-\u9FAF]|[\u2605-\u2606]|' +
          '[\u2190-\u2195]|\u203B');
        const japanese = japaneseRegex.test(value);
        return (japanese)
            ? (value.length > 12)
            : (value.length > 25);
      },
      is: true,
    }),
    
    noPdfLinks: report({
      level: 'high',
      type: 'PDF links are not allowed',
      andToast: 'PDF links are not allowed',
      when: (value) => /[.]pdf([^\w]|$)/.test(value),
      is: true,
    }),

    removeBannedDomains: change({
      to: '',
      andToast: 'Removing banned domain',
      when: (value) => {
        return (
          /^https?:..[^\/]*?youtube.com/.test(value) ||
          /le.com\/eva/.test(value)
        );
      },
      is: true,
    }),

    removeDashes: change({
      to: '',
      andToast: 'Removing dashes',
      when: (value) => /---/.test(value),
      is: true,
    }),

    removeScreenshot: change({
      to: '',
      andToast: 'No screenshots allowed',
      when: (value) => /^https.{17}gleplex.com.{12,13}$/.test(value),
      is: true,
    }),

    requireScreenshot: change({
      to: '',
      andToast: 'Only screenshots allowed',
      when: (value) => /^$|^https.{17}gleplex.com.{12,13}$/.test(value),
      is: false,
    }),

    requireUrl: change({
      to: '',
      andToast: 'Only links are allowed',
      when: (value) => /^$|^https?:\/\/[^\s]+$/.test(value),
      is: false,
    }),

    trim: change({
      through: (value) => value.trim(),
      when: (value) => value.trim() !== value,
      andToast: 'Removing extra spaces',
    }),

    removeQuotes: change({
      through: (value) => value.replace(/[`‘’｀]/, ''),
      when: (value) => /[`‘’｀]/.test(value),
      andToast: 'Removing quote',
    }),
  };

  return {
    brandCapitalisation,
    change,
    checkCapitals,
    comment,
    checkEmptyCreative,
    disableSpellcheck,
    getScreenshotText,
    getLinksFromComment,
    guiUpdate,
    item,
    keepAlive,
    manageTabs,
    noDomainMismatch,
    noDuplicateValues,
    noDuplicateVerbs,
    report,
    resetCounter,
    setStatus,
    skipTask,
    submit,
    tabOrder,
    toggleSelectYesNo,
    updateCharacterCount,
    ...reportOrChange,
  }
}
)();

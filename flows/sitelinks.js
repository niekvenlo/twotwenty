  flows.sitelinks = (function slModule() {

    /** string - Describes the current stage */
    let stage;
    let taskId;

    function init() {
      if (taskId === environment.taskId()) {
        return;
      } else {
        taskId = environment.taskId();
      }
      setupReactions();
      toStage('start');
    }

    const stages = {
      async start() {
        util.attention(ref.approvalButtons, 1, 'click');
        shared.comment.removeInitials();
        shared.guiUpdate('Ready to edit');
      },

      async approve() {
        util.attention(ref.approvalButtons, 0, 'click');
        completescreenshots();
        shared.comment.focus();
        if (!user.config.get('keep tabs open until submitting')) {
          shared.manageTabs.close();
        }
        if (!(ref.submitButton[0].disabled)) {
          shared.comment.addInitials(shared.getScreenshotText());
          shared.guiUpdate('Approved');
        } else {
          toStage('start');
          if (document.querySelector('.EGKJNJB-d-Db')) {
            util.attention(ref.editButton0, 0, 'click');
            user.log.warn('EWOQ has a network issue');
          }
        }
      },

      async submit() {
        const creativeUrl =
            ref.creative&& ref.creative[1] && ref.creative[1].textContent;
        const submitted = await shared.submit(creativeUrl);
        if (!submitted) {
          toStage('approve');
        }
      }
    };

    const stageIs = (...p) => p.includes(stage);

    async function toStage(name) {
      stage = name;
      stages[name]();
    }

    const approve = () => stageIs('start') && toStage('approve');
    const submit = () => stageIs('approve') && toStage('submit');
    const start = () => stageIs('approve') && toStage('start');
    
    /**
     * When pasting a url, it is moved from one box to another. The url is also
     * analysed and reduced to a descriptive string.
     * E.g. pasting 'http://www.example.com/hats' into the first box, it moves
     * the url to the second box and writes 'Hats' to the first box.
     *
     * @param {Object} _ - Unused parameter. The triggering proxy.
     * @param {number} idx - Index of the proxy in the group.
     * @param {Object[]} group - Array of two proxies.
     */
    async function fallThrough (_, idx, group) {
      if (group.length !== 2) {
        throw new RangeError('fallThrough requires two proxies.');
      }
      if (idx > 0) {
        return;
      }
      const pastedValue = group[0].value;
      if (/gleplex/.test(pastedValue)) {
        group[0].value = '';
        util.wait().then(() => {
          group[0].click();
          user.log.warn(
            'Cannot paste a screenshot here',
            {save: true, print: true, toast: true},
          );
        });
        return;
      }
      if (/^https?:/.test(pastedValue)) {
        group[1].value = pastedValue;
        util.wait().then(() => {
          util.attention(group, 1, 'click');
          util.attention(group, 0, 'click, focus');
        });
      }
      let value = group[0].value;
      value = await commonReplacements(value);
      value = await shared.brandCapitalisation(value);
      group[0].value = value;
      if (pastedValue === value) {
        user.log.low(
          `No change to '${pastedValue}'`,
          {debug: true, print: false, toast: false},
        );
        return;
      }
      user.log.notice(
        `'${value}' from '${pastedValue}'`,
          {debug: true, print: false, toast: true},
      );
    }
    fallThrough = util.delay(fallThrough, 0);
    
    async function commonReplacements(value) {
      const keepCaps = user.config.get('keep original capitalisation');
      const replacementStore =
          user.access('CommonReplacements', environment.locale());
      let tmpValue = (/^http/.test(value))
          ? decodeURIComponent(
              value
                  .replace(/\/index/i, '')
                  .match(/[^\/]*[\/]?$/)[0]
                  .replace(/([.]\w+)$/i, '')
                  .replace(/[+_-]+/g, ' ')
            )
          : value;
      tmpValue = tmpValue
          .replace(/[\s+_]+/g, ' ')
          .replace(/\/$/g, '')
          .replace(/[#?­*]/g, '')
          .replace(/’/, `'`)
          .trim();
      tmpValue = (keepCaps) ? tmpValue : tmpValue.toLowerCase();
      const applyRule = async (replace) => {
        const [regex, replaceWith] = replace;
        tmpValue = tmpValue.replace(util.toRegex(regex), replaceWith);
      }
      for (let replace of replacementStore) {
        await applyRule(replace);
      }
      return (keepCaps) ? tmpValue : util.cap.firstLetter(tmpValue);
    }
    switch (environment.locale()) {
      case 'Dutch':
        atest.group('commonReplacements', {
          'About us': () => commonReplacements('overons') === 'Over ons',
          'Read our blog': () => commonReplacements('blog') === 'Lees onze blog',
          'Url': () => {
            const ret = commonReplacements('https://ex.com/blog.html');
            return ret === 'Lees onze blog';
          }
        });
        break;
      default:
        break;
    }
    
    const noForbiddenPhrase = util.delay(shared.report({
      level: 'medium',
      type: 'Forbidden phrase',
      when: async (value) => {
        const phrases = user.access('ForbiddenPhrases', environment.locale());
        const applyRule = (rule) => {
          const [phrase, message] = rule;
          const regex = util.toRegex(phrase);
          if (regex && regex.test(value)) {
            return message || true;
          }
        }
        for (let rule of phrases) {
          const ret = await applyRule(rule);
          if (ret) {
            return ret;
          }
        }
        return false;
      },
      is: true,
    }), 100);

    function getScreenshotObjects() {
      const invalidScreenshot = ref.invalidScreenshot || [''];
      const screenshotAreas = ref.screenshots0 || [];
      const commentscreenshots = shared.getLinksFromComment();
      const allscreenshots = [
        ...invalidScreenshot,
        ...screenshotAreas,
        ...commentscreenshots,
      ].filter(ss => /^http/.test(ss.value));
      if (!environment.isAnalystTask() && allscreenshots.length < 1) {
        const missingScreenshot =
            {value: 'https://screenshot.googleplex.com/ERgyTM2vv5s'};
        return [missingScreenshot];
      }
      if (allscreenshots.length < 0) {
        user.log.warn('Screenshot meme issue');
      }
      return allscreenshots;
    }

    async function refreshTabs() {
      const openInTabs = ref.openInTabs || [];
      const lp = openInTabs.slice(-1);
      const tabs = openInTabs.slice(0, -1);
      const screenshots = getScreenshotObjects();
      const originalLp = ref.finalUrl || [];
      await util.wait(100);
      const allLinks = [
        ...tabs,
        ...screenshots,
        ...lp,
        ...originalLp,
      ].map(el => el.value).filter(value => /^http/.test(value));
      shared.manageTabs.refresh(allLinks);
    }

    /**
     * Before starting a task, decide whether to skip it or to open all
     * tabs.
     */
    function beginTask() {
      if (environment.isOwnTask()) {
        shared.skipTask();
        return;
      }
      refreshTabs();
      util.attention(ref.addDataButton0, 0, 'focus');
      util.attention(ref.editButton0, 0, 'focus');
      util.attention(ref.creative, 0, 'scrollIntoView');
    }

    /**
     * Ensure that all screenshot boxes are filled in. Fills in blank
     * boxes with the first screenshot link found, starting from the left.
     *
     * @ref {screenshots0}
     */
    function completescreenshots() {
      const screenshots = ref.screenshots0 || [];
      const values = screenshots.map((d) => d.value).reverse();
      const getLink = (num) => (values.slice(5 - num).find((d) => d) || '');
      for (let idx in screenshots) {
        const screenshot = screenshots[idx];
        if (!screenshot.value && !screenshot.disabled) {
          screenshot.value = getLink(idx) || getLink(5);
        }
      }
    }

    function checkDomainMismatch() {
      const getTrimmedDomain = (url) => {
        const domain = util.getDomain(url).toLowerCase();
        const n = (/co.uk/.test(url)) ? 3 : 2;
        return domain.split('.').slice(-n).join('.');
      }
      const one = getTrimmedDomain('https://' + ref.creative[1].textContent);
      const two = getTrimmedDomain(ref.openInTabs.slice(-1)[0].value);
      const three = getTrimmedDomain(ref.finalUrl[0].value);
      const links = [one, two, three].filter(o => o);

      const packet = {proxy: ref.creative[1], issueType: 'Creative domain mismatch'};
      if (new Set(links).size !== 1) {
        packet.issueLevel = 'medium';
        packet.message = links.join(', ');
      }
      util.dispatch('issueUpdate', packet);
    }
    checkDomainMismatch = util.debounce(checkDomainMismatch);

    /**
     * Set up event handlers.
     */
    function setupReactions() {
      
      const isAnalyst = environment.isAnalystTask();
      
      function noDuplicateValues(_, __, group) {
        const getText = (proxy) => {
          const trimmed = proxy.value
              .replace(/\/?((index)?.(html|htm|php))?#?\??$$/, '')
              .replace(/^https?:\/\/(www[.])?/, 'https://');
          return util.normaliseUrl(trimmed).toLowerCase();
        };
        shared.noDuplicateValues(group, getText);
      }

      ー({
        name: 'Text',
        rootSelect: '#extraction-editing',
        select: 'textarea',
        pick: isAnalyst
            ? [1, 5, 9, 13, 17]
            : [1, 4, 7, 10, 13],
        onClick: (proxy, idx) => {
          util.attention(ref.addItem0.slice(-3), idx - 2, 'click');
          util.attention([proxy], 0, 'focus');
        },
        onFocusout: [
          shared.trim,
          noDuplicateValues,
          shared.noDuplicateVerbs,
          shared.removeQuotes,
        ],
        onInteract: [
          shared.checkCapitals,
          shared.noMoreThanXChars,
          noDuplicateValues,
          shared.noDuplicateVerbs,
          noForbiddenPhrase,
        ],
        onKeydown_CtrlShiftAltArrowLeft:
            (_, idx) => shared.item.swapLeft(idx),
        onKeydown_CtrlShiftAltArrowRight:
            (_, idx) => shared.item.swapRight(idx),
        onKeydown_CtrlAltArrowLeft:
            (_, idx) => shared.item.moveLeft(idx),
        onKeydown_CtrlAltArrowRight:
            (_, idx) => shared.item.moveRight(idx),
        onKeydown_CtrlDelete: (_, idx) => shared.item.remove(idx),
        onLoad: [
          shared.trim,
          shared.checkCapitals,
          shared.noMoreThanXChars,
          noDuplicateValues,
          shared.noDuplicateVerbs,
          noForbiddenPhrase,
        ],
        ref: 'textAreas0',
      });

      ー({
        name: 'Link',
        rootSelect: '#extraction-editing',
        select: 'textarea',
        pick: isAnalyst
            ? [2, 6, 10, 14, 18]
            : [2, 5, 8, 11, 14],
        onFocusout: [
          shared.requireUrl,
          shared.removeScreenshot,
          shared.removeQuotes,
          shared.noPdfLinks,
          shared.noMalformedLinks,
          shared.noHomepageLinks,
        ],
        onInteract: shared.noPdfLinks,
        onKeydown_CtrlAlt: (_, idx) => shared.item.focus(idx),
        onLoad: [
          shared.disableSpellcheck,
          shared.keepAlive,
          shared.noHomepageLinks,
          shared.noMalformedLinks,
          shared.noPdfLinks,
        ],
        onPaste: [
          shared.requireUrl,
          shared.removeBannedDomains,
          shared.removeScreenshot,
          shared.noHomepageLinks,
          shared.noMalformedLinks,
          shared.noPdfLinks,
        ],
        ref: 'linkAreas0',
      });
      
      ー({
        name: 'Screenshot',
        rootSelect: isAnalyst
            ? '#extraction-editing'
            : '.extraction-screenshots',
        select: 'textarea',
        pick: isAnalyst
            ? [3, 7, 11, 15, 19]
            : [0, 1, 2, 3, 4],
        onFocusout: [
          shared.requireUrl,
          shared.requireScreenshot,
          shared.removeQuotes,
        ],
        onKeydown_CtrlAlt: (_, idx) => shared.item.focus(idx),
        onLoad: shared.disableSpellcheck,
        onPaste: [
          shared.requireUrl,
          shared.requireScreenshot,
        ],
        ref: 'screenshots0',
      });

      ー({
        name: 'Dashes',
        rootSelect: '#extraction-editing',
        select: 'textarea',
        pick: isAnalyst
            ? [4, 8, 12, 16, 20]
            : [3, 6, 9, 12, 15],
        onFocusin: shared.removeDashes,
        onFocusout: [
          shared.removeQuotes,
          shared.addDashes,
        ],
        onKeydown_CtrlAlt: (_, idx) => shared.item.focus(idx),
        onLoad: [
          shared.addDashes,
          shared.tabOrder.remove,
          shared.disableSpellcheck,
        ],
      });

      ー({
        name: 'Analyst Comment',
        select: '.feedback-display-text',
        pick: [0],
        ref: 'analystComment',
      });

      ー({
        name: 'Extraction Page Url',
        rootSelect: '#extraction-editing',
        select: 'textarea',
        pick: [0],
        onKeydown_CtrlAltArrowRight: () => {
          util.attention(ref.editButton0, 0, 'click');
          shared.item.focus(0);
        },
        onLoad: [
          shared.disableSpellcheck,
          shared.removeScreenshot,
          shared.requireUrl,
        ],
        ref: 'extractionUrl0',
      });

      ー({
        name: 'LinksAndLP',
        rootSelect: '#extraction-editing',
        select: 'textarea',
        pick: isAnalyst
            ? [2, 6, 10, 14, 18, 0]
            : [2, 5, 8, 11, 14, 0],
        onInteract: [
          shared.noDomainMismatch,
          noDuplicateValues,
        ],
        onLoad: [
          shared.noDomainMismatch,
          noDuplicateValues,
        ],
        onPaste: [
          shared.noDomainMismatch,
          noDuplicateValues,
        ],
        ref: 'openInTabs',
      });

      ー({
        name: 'Final Url',
        select: 'textarea',
        pick: [65],
        ref: 'finalUrl',
      });

      ー({
        name: 'InvalidScreenshot',
        rootSelect: '.errorbox-good',
        rootNumber: 1,
        select: 'textarea',
        onKeydown_CtrlAltArrowRight: shared.comment.focus,
        onFocusout: shared.removeQuotes,
        onLoad: [
          shared.disableSpellcheck,
          shared.requireUrl,
          shared.requireScreenshot,
        ],
        onPaste: [
          shared.requireUrl,
          shared.requireScreenshot,
        ],
        ref: 'invalidScreenshot',
      });

      ー({
        name: 'Creative',
        rootSelect: '.context-item',
        rootNumber: [2],
        select: '*',
        pick: [3, 6, 8],
        onLoad: [
          shared.checkEmptyCreative,
          checkDomainMismatch,
        ],
        ref: 'creative',
      });

      const fall = isAnalyst
          ? [[1, 2],[5, 6],[9, 10],[13, 14],[17, 18]]
          : [[1, 2],[4, 5],[7, 8],[10, 11],[13, 14]];
      for (let pair of fall) {
        ー({
          name: 'Fall',
          rootSelect: '#extraction-editing',
          select: 'textarea',
          pick: pair,
          onPaste: fallThrough,
        });
      }

      const remaining = isAnalyst
          ? [0, 8, 17, 26, 35]
          : [0, 6, 13, 20, 27];
      for (let rootNumber of remaining) {
        ー({
          name: 'Remaining',
          rootSelect: '.extraction-item table',
          rootNumber,
          select: 'div, textarea',
          pick: [2, 3],
          onChange: shared.updateCharacterCount,
          onFocusin: shared.updateCharacterCount,
          onKeydown: shared.updateCharacterCount,
          onLoad: shared.updateCharacterCount,
        });
      }

      ー({
        name: 'StatusDropdown',
        select: 'select',
        pick: [0, 1, 2],
        ref: 'statusDropdown',
      });

      ー({
        name: 'Add Data',
        rootSelect: '.extraction',
        select: 'label',
        withText: 'Add Data',
        onKeydown_CtrlAltArrowRight: () => {
          util.attention(ref.addDataButton0, 0, 'click');
          shared.item.focus(0);
        },
        ref: 'addDataButton0',
      });

      ー({
        name: 'Edit',
        rootSelect: '.extraction',
        select: 'label',
        withText: 'Edit',
        onKeydown_CtrlAltArrowRight: () => {
          util.attention(ref.editButton0, 0, 'click');
          shared.item.focus(0);
        },
        onLoad: shared.tabOrder.add,
        ref: 'editButton0',
      });

      ー({
        name: 'Add Item',
        rootSelect: '#extraction-editing',
        select: 'label',
        withText: 'Add Item',
        ref: 'addItem0',
      });

      ー({
        name: 'Leave Blank',
        rootSelect: '#extraction-editing',
        select: 'label',
        withText: 'Leave Blank',
        ref: 'leaveBlank0',
      });

      ー({
        name: 'ApprovalButtons',
        rootSelect: '.primaryContent',
        rootNumber: 3,
        select: 'label',
        pick: [0, 1],
        ref: 'approvalButtons',
      });

      ー({
        name: 'Comment Box',
        rootSelect: '.addComments',
        select: 'textarea',
        pick: [0],
        onFocusout: util.delay(start, 200),
        onInteract: shared.removeQuotes,
        onKeydown_CtrlAltArrowRight: () => shared.item.focus(0),
        ref: 'finalCommentBox',
      });

      ー({
        name: 'CanOrCannotExtract',
        select: 'label',
        pick: [0, 1],
        onKeydown_CtrlAltArrowRight: () => shared.item.focus(0),
        ref: 'canOrCannotExtractButtons',
      });
      
      ー({
        name: 'Visit LP',
        select: '.lpButton button',
        pick: [0],
        css: {opacity: 1},
      });
      
      function manualSubmit() {
        const msg =
            'Please use the Submit Hotkey instead of clicking manually.';
        user.log.warn(
          msg,
          {save: true, print: true, toast: true}
        );
        alert(msg);
      };
      manualSubmit = util.debounce(manualSubmit, 4000);

      ー({
        name: 'Submit Button',
        select: '.submitTaskButton',
        pick: [0],
        css: {opacity: 1},
        onFocusin: manualSubmit,
        ref: 'submitButton',
      })[0].textContent = 'Ready to submit';

      ー({
        name: 'Skip Button',
        select: '.taskIssueButton',
        pick: [0],
        ref: 'skipButton'
      });

      ー({
        name: 'Task Title',
        select: '.taskTitle',
        ref: 'taskTitle'
      });

      ー({
        name: 'TabRemove',
        select: 'label, button',
        onLoad: shared.tabOrder.remove,
      });

      ー({
        name: 'Extractions2And3',
        select: '.extraction',
        pick: [1, 2],
        css: {display: 'none'},
      });

      ー({
        name: 'Preview Extractions',
        select: '.extraction-preview',
        pick: [1, 2],
        css: {display: 'none'},
      });
      
      const setStatus = shared.setStatus;
      const statusReactions = {
        onKeydown_CtrlAltDigit0: setStatus('canExtract'),
        onKeydown_CtrlAltDigit1: setStatus('insufficient'),
        onKeydown_CtrlAltDigit2: setStatus('pageError'),
        onKeydown_CtrlAltDigit3: setStatus('dynamic'),
        onKeydown_CtrlAltDigit4: setStatus('nonLocale'),
        onKeydown_CtrlAltDigit5: setStatus('other'),
        onKeydown_CtrlAltDigit6: setStatus('pII'),
        onKeydown_CtrlAltDigit7: setStatus('drugDomain'),
        onKeydown_CtrlAltDigit8: setStatus('alcoholDomain'),
        onKeydown_CtrlAltDigit9: setStatus('adultDomain'),
        onKeydown_CtrlShiftAltDigit0: setStatus('canExtract'),
        onKeydown_CtrlShiftAltDigit1: setStatus('other'),
        onKeydown_CtrlShiftAltDigit2: setStatus('urlsUnchanged'),
        onKeydown_CtrlShiftAltDigit3: setStatus('urlMismatch'),
        onKeydown_CtrlShiftAltDigit4: setStatus('emptyCreative'),
      };
      
      const experimentalEscapeApprove = () => {
        if (user.config.get('use escape-key to approve')) {
          approve();
        }
      };
      
      const experimentalSubmit = () => {
        if (user.config.get('use escape-key to approve')) {
          submit();
        }
      };
      
      const submitKeys = {
        onKeydown_CtrlEnter: submit,
        onKeydown_CtrlAltEnter: submit,
        onKeydown_CtrlNumpadEnter: submit,
        onKeydown_CtrlShiftEscape: experimentalSubmit,
      };
      
      const otherKeys = {
        onKeydown_Backquote: beginTask,
        onKeydown_CtrlAltBackquote: beginTask,
        onKeydown_CtrlAltBracketLeft: shared.resetCounter,
        onKeydown_CtrlAltBracketRight: shared.skipTask,
        onKeydown_NumpadSubtract: shared.skipTask,
        onKeydown_NumpadAdd: approve,
        onKeydown_Backslash: approve,
        onKeydown_Escape: experimentalEscapeApprove,
        onKeydown_CtrlShiftDelete: shared.item.removeAll,
      };

      eventReactions.setGlobal({
        ...statusReactions,
        ...submitKeys,
        ...otherKeys,
      });
    }

    return {init};
  })();
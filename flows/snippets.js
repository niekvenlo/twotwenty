flows.snippets = (function slModule() {

  function init() {

    shared.guiUpdate('Structured Snippets');
    const isAnalyst = environment.isAnalystTask();

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
    
    function approve() {
      util.attention(ref.approvalButtons, 0, 'click');
      shared.comment.addInitials(shared.getScreenshotText());
    }
    
    function unapprove() {
      util.attention(ref.approvalButtons, 1, 'click');
      shared.comment.removeInitials();
    }
    unapprove = util.delay(unapprove, 200);
    unapprove();
    
    function isExtractionEmpty(num) {
      const extraction = ref['textAreas' + num];
      if (!extraction) {
        return false;
      }
      const nonEmpty = extraction.filter(textbox => textbox.value !== '');
      return nonEmpty.length < 1;
    }

    function getScreenshotObjects() {
      const invalidScreenshot = ref.invalidScreenshot || [''];
      const screenshotAreas = [
        ...(ref.screenshots0 || []),
        ...(ref.screenshots1 || []),
        ...(ref.screenshots2 || []),
      ];
      const commentScreenshots = shared.getLinksFromComment();
      const allScreenshots = [
        ...invalidScreenshot,
        ...screenshotAreas,
        ...commentScreenshots,
      ].filter(ss => ss.value !== '');
      if (!isAnalyst && allScreenshots.length < 1) {
        const missingScreenshot =
            {value: 'https://screenshot.googleplex.com/ERgyTM2vv5s'};
        return [missingScreenshot];
      }
      return allScreenshots;
    }
    
    async function refreshTabs() {
      const lp = ref.extractionUrl0 || [];
      const screenshots = getScreenshotObjects();
      const originalLp = ref.finalUrl || [];
      await util.wait(100);
      const allLinks = [
        ...screenshots,
        ...lp,
        ...originalLp,
      ].map(el => el.value).filter(value => /^http/.test(value));
      shared.manageTabs.refresh(allLinks);
    }

    /**
     * Detect redundant words between the creative and extraction values.
     *
     * @ref {creative}
     * @ref {textAreas0}
     * @ref {textAreas1}
     * @ref {textAreas2}
     */
    const checkRedundancy = (function() {
      const commons = {
        'reserveren': 'reserveer',
        'reservering': 'reserveer',
        'reservatie': 'reserveer',
        'registreren': 'registreer',
        'registratie': 'registreer',
        'meld': 'aanmelden',
        'aanmelding': 'aanmelden',
        'speek': 'afspraak',
        'gamma': 'assortiment',
        'boeken': 'boek',
        'boeking': 'boek',
        'acties' : 'actie',
        'aanbieding' : 'actie',
        'aanbiedingen' : 'actie',
        'promo' : 'actie',
        'promotie' : 'actie',
        'promoties' : 'actie',
        'sale' : 'actie',
        'schrijf': 'inschrijven',
        'inschrijving': 'inschrijven',
        'beoordelingen' : 'recensies',
        'waarderingen' : 'recensies',
        'beoordeeld' : 'recensies',
        'ervaringen' : 'recensies',
        'verhalen' : 'recensies',
        'reviews' : 'recensies',
        'prijs': 'tarieven',
        'prijzen': 'tarieven',
        'waardebepaaling': 'taxatie',
        'folder': 'brochure',
        'folders': 'brochure',
        'brochures': 'brochure',
        'dealers': 'verkooppunten',
        'winkels': 'verkooppunten',
        'shop': 'verkooppunten',
        'showroom': 'toonzaal',
      };
      const storedCommons =
          user.access('SnippetRedundancy', environment.locale()) || [];
      console.log(storedCommons);
      for (let common of storedCommons) {
        commons[common[0]] = common[1];
      }
      console.log(commons);
      function checkRedundancy(proxy) {
        function makeWordArray (string) {
          const words = string.split(/\s/g)
           .filter(d => d.length > 3)
           .filter(d => !/[:\d]/.test(d))
           .filter(d => !/[.]\w/.test(d))
           .map(d => d.toLowerCase().replace(/[!?]/g, ''))
           .sort();
          const makeCommon = (word) => commons[word] || word;
          return [...new Set(words)].map(makeCommon);
        };
        const creativeText = ref.creative.map(d => d.textContent).join(' ');
        const creativeWords = makeWordArray(creativeText);
        const textWords = makeWordArray(proxy.value);
  
        const packet = {proxy, issueType: 'Redundant with creative'};
        for (let word of creativeWords) {
          if (textWords.includes(word)) {
            packet.issueLevel = 'low';
            packet.message = word;
          }
        }
        util.dispatch('issueUpdate', packet);
      }
      return util.debounce(checkRedundancy, 100);
    })();
    

    ー({
      name: 'TabRemove',
      select: 'label, button',
      onLoad: shared.tabOrder.remove,
    });
    
    function copyExtractionUrl(proxy) {
      const fields = [
        ...ref.extractionUrl0,
        ...ref.extractionUrl1,
        ...ref.extractionUrl2
      ];
      for (let field of fields) {
        field.value = proxy.value;
      }
    }
    
    if (user.config.get('snippets: keep creative in view')) {
      ー({
        name: 'Fixed creative',
        select: '.context-item',
        pick: [2],
        css: {
          position: 'fixed',
          top: '70px',
          backgroundColor: 'rgba(255,255,255,0.8)',
        },
        ref: 'creative',
      });
    }
    
    ー({
      name: 'Creative',
      rootSelect: '.context-item',
      rootNumber: [2],
      select: '*',
      pick: [3, 6, 8],
      ref: 'creative',
    });

    for (let num of [0, 1, 2]) {
      ー({
        name: 'HeaderDropdown',
        rootSelect: '.extraction',
        rootNumber: num,
        select: 'select',
        onKeydown_CtrlAlt: () => {
          util.attention(ref['addDataButton' + num], 0, 'click');
          shared.item.focus(0, num);
        },
        ref: 'ssHeaders' + num,
      });

      ー({
        name: 'Add Data',
        rootSelect: '.extraction',
        rootNumber: num,
        select: 'label',
        withText: 'Add Data',
        onKeydown_CtrlAltArrowRight: () => {
          util.attention(ref['addDataButton' + num], 0, 'click');
          shared.item.focus(0, num);
        },
        onKeydown_End: () => {
          util.attention(ref['addDataButton' + num], 0, 'click');
          shared.item.focus(0, num);
        },
        ref: 'addDataButton' + num,
      });

      ー({
        name: 'Leave Extraction Blank',
        rootSelect: '.extraction',
        rootNumber: num,
        select: 'label',
        withText: 'Leave Blank',
        ref: 'leaveExtractionBlank' + num,
      });
      
      ー({
        name: 'Edit',
        rootSelect: '.extraction',
        rootNumber: num,
        select: 'label',
        withText: 'Edit',
        onKeydown_CtrlAltArrowRight: () => {
          util.attention(ref['editButton' + num], 0, 'click');
          shared.item.focus(0, num);
        },
        onKeydown_End: () => {
          util.attention(ref['editButton' + num], 0, 'click');
          shared.item.focus(0, num);
        },
        onLoad: shared.tabOrder.add,
        ref: 'editButton' + num,
      });
      ー({
        name: 'Add Item',
        rootSelect: '#extraction-editing',
        rootNumber: num,
        select: 'label',
        withText: 'Add Item',
        ref: 'addItem' + num,
      });
  
      ー({
        name: 'Leave Blank',
        rootSelect: '#extraction-editing',
        rootNumber: num,
        select: 'label',
        withText: 'Leave Blank',
        ref: 'leaveBlank' + num,
      });
      
      function addHeader(type, num) {
        const ids = {
          'Interessen': 257,
          'Typen': 39,
          'Services': 144,
          'Locaties': 261,
          'Opties': 264,
          'Kenmerken': 258,
          'Stijlen': 267,
          'Materialen': 262,
          'Merken': 263,
          'Categorieën': 253,
        }
        return () => {
          ref['ssHeaders' + num] &&
              (ref['ssHeaders' + num][0].value = ids[type]);
        }
      }

      ー({
        name: 'Text ' + num,
        rootSelect: '#extraction-editing',
        rootNumber: num,
        select: 'textarea',
        pick: isAnalyst
            ? [2, 5, 8, 11, 15]
            : [2, 4, 6, 8, 10],
        onFocusout: [
          shared.trim,
          shared.removeQuotes,
          checkRedundancy,
        ],
        onInteract: checkRedundancy,
        onKeydown_CtrlShiftAltArrowLeft:
            (_, idx) => shared.item.swapLeft(idx, num),
        onKeydown_CtrlShiftAltArrowRight:
            (_, idx) => shared.item.swapRight(idx, num),
        onKeydown_CtrlAltArrowLeft:
            (_, idx) => shared.item.moveLeft(idx, num),
        onKeydown_CtrlAltArrowRight:
            (_, idx) => shared.item.moveRight(idx, num),
        onKeydown_CtrlAltDigit1: addHeader('Interessen', num),
        onKeydown_CtrlAltDigit2: addHeader('Typen', num),
        onKeydown_CtrlAltDigit3: addHeader('Services', num),
        onKeydown_CtrlAltDigit4: addHeader('Locaties', num),
        onKeydown_CtrlAltDigit5: addHeader('Opties', num),
        onKeydown_CtrlAltDigit6: addHeader('Kenmerken', num),
        onKeydown_CtrlAltDigit7: addHeader('Stijlen', num),
        onKeydown_CtrlAltDigit8: addHeader('Materialen', num),
        onKeydown_CtrlAltDigit9: addHeader('Merken', num),
        onKeydown_End: () => {
          shared.item.focus(0, num + 1);
        },
        onKeydown_Home: () => {
          const upperExtractionExists = shared.item.focus(0, num - 1);
          if (!upperExtractionExists) {
            util.attention(ref.addDataButton0, 0, 'focus');
            util.attention(ref.editButton0, 0, 'focus');
            util.attention(ref.creative, 0, 'scrollIntoView');
          }
          if (isExtractionEmpty(num)) {
            util.attention(ref['leaveExtractionBlank' + num], 0, 'click');
          }
        },
        onKeydown_CtrlDelete: (_, idx) => shared.item.remove(idx, num),
        onLoad: checkRedundancy,
        ref: 'textAreas' + num,
      });

      ー({
        name: 'Screenshot ' + num,
        rootSelect: isAnalyst
            ? '#extraction-editing'
            : '.extraction-screenshots',
        rootNumber: num,
        select: 'textarea',
        pick: isAnalyst
            ? [3, 6, 9, 12, 16]
            : [0, 1, 2, 3, 4],
        onFocusout: [
          shared.requireUrl,
          shared.requireScreenshot,
        ],
        onKeydown_CtrlAlt: (_, idx) => shared.item.focus(idx, num),
        onLoad: shared.disableSpellcheck,
        onPaste: [
          shared.requireUrl,
          shared.requireScreenshot,
        ],
        ref: 'screenshots' + num,
      });

      ー({
        name: 'Dashes',
        rootSelect: '#extraction-editing',
        rootNumber: num,
        select: 'textarea',
        pick: isAnalyst
            ? [4, 7, 10, 13, 16]
            : [3, 5, 7, 9, 11],
        onKeydown_CtrlAlt: (_, idx) => shared.item.focus(idx, num),
        onFocusin: shared.removeDashes,
        onFocusout: shared.addDashes,
        onLoad: shared.addDashes,
      });
    }

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
      onLoad: [
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
      name: 'Analyst Comment',
      select: '.feedback-display-text',
      pick: [0],
      ref: 'analystComment',
    });
    
    ー({
      name: 'Visit LP',
      select: '.lpButton button',
      pick: [0],
      css: {opacity: 1},
    });

    ー({
      name: 'LP',
      rootSelect: '#extraction-editing',
      rootNumber: 0,
      select: 'textarea',
      pick: [0],
      onFocusout: copyExtractionUrl,
      onInteract: shared.requireUrl,
      onKeydown_CtrlAltArrowRight: () => {
        util.attention(ref.editButton0, 0, 'click');
        shared.item.focus(0);
      },
      onKeydown_End: () => {
        util.attention(ref.editButton0, 0, 'click');
        shared.item.focus(0);
      },
      onLoad: [
        shared.removeScreenshot,
        shared.requireUrl,
        copyExtractionUrl,
      ],
      onPaste: shared.requireUrl,
      ref: 'extractionUrl0',
    });
    
    for (let num of [1, 2]) {
      ー({
        name: 'LP',
        rootSelect: '#extraction-editing',
        rootNumber: num,
        select: 'textarea',
        pick: [0],
        css: {opacity: 0.6},
        onFocusout: copyExtractionUrl,
        onLoad: shared.tabOrder.remove,
        ref: 'extractionUrl' + num,
      });
    }

    ー({
      name: 'CanOrCannotExtract',
      select: 'label',
      pick: [0, 1],
      onKeydown_CtrlAltArrowRight: () => shared.item.focus(0),
      ref: 'canOrCannotExtractButtons',
    });
    
    ー({
      name: 'StatusDropdown',
      select: 'select',
      pick: [0, 1, 2],
      ref: 'statusDropdown',
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
      onFocusout: unapprove,
      ref: 'finalCommentBox',
    });

    ー({
      name: 'SubmitButton',
      select: '.submitTaskButton',
      pick: [0],
      css: {opacity: 1},
      ref: 'submitButton',
    })[0].textContent = 'Ready to submit';

    ー({
      name: 'Skip Button',
      select: '.taskIssueButton',
      pick: [0],
      ref: 'skipButton'
    });

    ー({
      name: 'Extraction0',
      select: '.extraction',
      pick: [0],
      css: {backgroundColor: '#fef'},
    });

    ー({
      name: 'Extraction1',
      select: '.extraction',
      pick: [1],
      css: {backgroundColor: '#ffe'},
    });
    ー({
      name: 'Extraction2',
      select: '.extraction',
      pick: [2],
      css: {backgroundColor: '#eff'},
    });
    
    function setStatus(type) {
      const empty = isExtractionEmpty;
      const func = shared.setStatus(type);
      return function() {
        if (empty(0) && empty(1) && empty(2)) {
          func();
          shared.item.focus(0, 0);
        }
      }
    }

    const statusReactions = {
      onKeydown_CtrlAltDigit0: setStatus('canExtract'),
      onKeydown_CtrlAltDigit1: setStatus('insufficient'),
      onKeydown_CtrlAltDigit2: setStatus('pageError'),
      onKeydown_CtrlAltDigit3: setStatus('dynamic'),
      onKeydown_CtrlAltDigit4: setStatus('nonLocale'),
      onKeydown_CtrlAltDigit5: setStatus('drug'),
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

    eventReactions.setGlobal({
      ...statusReactions,
      onKeydown_Backquote: beginTask,
      onKeydown_CtrlAltBackquote: beginTask,
      onKeydown_CtrlAltBracketLeft: shared.resetCounter,
      onKeydown_CtrlAltBracketRight: shared.skipTask,
      onKeydown_NumpadSubtract: shared.skipTask,
      onKeydown_Backslash: approve,
      onKeydown_CtrlEnter: shared.submit,
      onKeydown_CtrlAltEnter: shared.submit,
      onKeydown_CtrlNumpadEnter: shared.submit,
      onKeydown_Escape: experimentalEscapeApprove,
      onKeydown_CtrlShiftDelete: shared.item.removeAll,
    });
  }

  return {init};
})();
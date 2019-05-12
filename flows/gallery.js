flows.gallery = (function galleryModule() {

  function init() {
    
    console.log('init gallery');

    shared.guiUpdate('Gallery Ads');
    
    const toast = (msg) => {
      user.log.notice(
        msg,
        {save: false, print: false, toast: true}
      );
    };

    const labels = [...document.getElementsByTagName('label')];
    const radios = [...document.getElementsByTagName('input')];
    const textareas = [...document.getElementsByTagName('textarea')];

    function toggle(n) {
      labels[1].click();
      const point = n * 2;
      if (radios[point].checked) {
        labels[point + 1].click();
        toast(`Turned problem ${n} off`);
      } else {
        labels[point].click();
        toast(`Turned problem ${n} on`);
      }
      if (point === 20) {
        setTimeout(() => textareas[0].focus());
      }
    }
    
    function ok() {
      labels[0].click();
      labels[0].scrollIntoView();
      toast('Ad meets all guidelines');
    }

    function noDuplicateValues(_, __, group) {
      const getText = (proxy) => {
        return proxy.textContent.trim().replace(/[.⚑]/g, '');
      };
      shared.noDuplicateValues(group, getText);
    }

    ー({
      name: 'Descriptions',
      select: 'span',
      pick: [4, 5, 6, 7, 8, 9, 10, 11],
      css: {fontSize: '1.2rem'},
      onLoad: noDuplicateValues,
    });

    ー({
      name: 'SubmitButton',
      select: '.submitTaskButton',
      pick: [0],
      css: {opacity: 1},
      ref: 'submitButton',
    });

    ー({
      name: 'Skip Button',
      select: '.taskIssueButton',
      pick: [0],
      ref: 'skipButton'
    });

    eventReactions.setGlobal({
      onKeydown_CtrlAltDigit1: () => toggle(1),
      onKeydown_CtrlAltDigit2: () => toggle(2),
      onKeydown_CtrlAltDigit3: () => toggle(3),
      onKeydown_CtrlAltDigit4: () => toggle(4),
      onKeydown_CtrlAltDigit5: () => toggle(5),
      onKeydown_CtrlAltDigit6: () => toggle(6),
      onKeydown_CtrlAltDigit7: () => toggle(7),
      onKeydown_CtrlAltDigit8: () => toggle(8),
      onKeydown_CtrlAltDigit9: () => toggle(9),
      onKeydown_CtrlAltDigit0: () => toggle(10),
      onKeydown_Equal: ok,
      onKeydown_CtrlAltEqual: ok,
      onKeydown_Backslash: ok,
      onKeydown_CtrlAltBackslash: ok,
      onKeydown_CtrlEnter: shared.submit,
      onKeydown_CtrlNumpadEnter: shared.submit,
      onKeydown_CtrlAltBracketLeft: shared.resetCounter,
      onKeydown_CtrlAltBracketRight: shared.skipTask,
    });
  }
  return {init};
})();
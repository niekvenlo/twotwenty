flows.pe = (function peModule() {

  function init() {

    shared.guiUpdate('Price Extension');

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
      ref: 'skipButton',
    });

    function clickLabel(...n) {
      for (let e of n) {
        util.attention(ref.labels, e - 1, 'click');
      }
    }

    ー({
      name: 'Labels',
      select: 'label',
      ref: 'labels',
    });

    eventReactions.setGlobal({
      onKeydown_Backslash: () => clickLabel(1),
      onKeydown_Digit1: () => clickLabel(2, 3),
      onKeydown_Digit2: () => clickLabel(2, 5),
      onKeydown_Digit3: () => clickLabel(2, 7),
      onKeydown_Digit4: () => clickLabel(2, 9),
      onKeydown_Digit5: () => clickLabel(2, 11),
      onKeydown_Digit6: () => clickLabel(2, 13),
      onKeydown_Digit7: () => clickLabel(2, 15),
      onKeydown_Digit8: () => clickLabel(2, 17),
      onKeydown_Digit9: () => clickLabel(2, 19),
      onKeydown_Digit0: () => clickLabel(2, 21),
      onKeydown_CtrlAltBracketLeft: shared.resetCounter,
      onKeydown_CtrlAltBracketRight: shared.skipTask,
      onKeydown_NumpadSubtract: shared.skipTask,
      onKeydown_CtrlEnter: shared.submit,
      onKeydown_CtrlAltEnter: shared.submit,
      onKeydown_CtrlNumpadEnter: shared.submit,
      onKeydown_Enter: shared.submit,
      onKeydown_NumpadEnter: shared.submit,
    });
  }
  return {init};
})();
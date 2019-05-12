flows.home = (function homeModule() {

  function init() {

    shared.guiUpdate('Rating Home Loaded');
    {
      const {name, version} = chrome.runtime.getManifest();
      user.log.ok(`${name}\nVersion ${version}`);
    }

    /**
     * Click the 'Acquire next task' button.
     */
    async function clickAcquire() {
      util.attention(ref.firstButton, 0, 'click');
      await util.retry(clickContinue, 50, 150, true)();
    }

    /**
     * Click the 'Continue to Task' button if it exists.
     */
    function clickContinue() {
      const continueButton = ref.fresh('firstButton');
      if (continueButton && continueButton.textContent.includes('Continue')) {
        continueButton.click();
        return true;
      }
      return false;
    }

    /**
     * Trigger the onClick toggle of yes/no select HTMLElements with the
     * keyboard.
     *
     * @param {number} key - Number representing the number key pressed.
     */
    function toggleSelect(key) {
      return function toggle() {
        util.attention(ref.select, key - 1, 'click');
      }
    }
    
    function toggleAllSelect() {
      for (let idx = 0; idx < 10; idx++) {
        toggleSelect(idx)();
      }
    }

    ー({
      name: 'Select',
      select: 'select',
      onClick: shared.toggleSelectYesNo,
      ref: 'select',
    });

    ー({
      name: 'First Button',
      select: 'button',
      pick: [0],
      onClick: clickAcquire,
      ref: 'firstButton',
    });

    eventReactions.setGlobal({
      onKeydown_Digit1: toggleSelect(1),
      onKeydown_Digit2: toggleSelect(2),
      onKeydown_Digit3: toggleSelect(3),
      onKeydown_Digit4: toggleSelect(4),
      onKeydown_Digit5: toggleSelect(5),
      onKeydown_Digit6: toggleSelect(6),
      onKeydown_Digit7: toggleSelect(7),
      onKeydown_Digit8: toggleSelect(8),
      onKeydown_Digit9: toggleSelect(9),
      onKeydown_Digit0: toggleAllSelect,
      onKeydown_Enter: clickAcquire,
      onKeydown_NumpadEnter: clickAcquire,
      onKeydown_Space: clickAcquire,
      onKeydown_CtrlAltBracketLeft: shared.resetCounter,
    });

  }
  return {init};
})();
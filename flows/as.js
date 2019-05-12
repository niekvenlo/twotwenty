flows.as = (function asModule() {
  
  function init() {
    creativeValidation();
    /*
     * @todo Add Approve/Submit Hotkey.
     * @todo Add Hotkeys mapping to 'issues'.
     * @todo Add support for the 3 other sub-flows.
     */
  }
  
  function creativeValidation() {
    ー({
      name: 'Visit LP',
      select: '.lpButton button',
      pick: [0],
      ref: 'visitLPButton',
    });
    
    ー({
      name: 'Provided Creatives',
      select: '#provided-creatives',
      pick: [0],
      ref: 'creatives',
    });
    
    function start() {
      util.attention(ref.visitLPButton, 0, 'click');
      util.attention(ref.creatives, 0, 'scrollIntoView');
    }
    
    function approve() {
      console.log('approve');
    }
    
    function submit() {
      console.log('submit');
    }
    
    eventReactions.setGlobal({
      onKeydown_Backquote: start,
      onKeydown_Backslash: approve,
      onKeydown_CtrlEnter: submit,
    });
  }
  return {init};
})();
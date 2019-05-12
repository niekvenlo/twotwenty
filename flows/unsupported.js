flows.unsupported = (function unsupportedModule() {

  function init() {

    shared.guiUpdate('Unsupported flow');

    (function addStylesheet () {
      const style = document.createElement('style');
      document.head.append(style);
      const addRule = (p) => style.sheet.insertRule(p, 0);
      const rules = [
        `.lpButton button { opacity: 1 }`,
        `.lpButton button { cursor: pointer }`,
        `.submitTaskButton { opacity: 1 }`,
        `.submitTaskButton { cursor: pointer }`,
      ];
      rules.forEach(addRule);
    })();

    eventReactions.setGlobal({
      onKeydown_CtrlAltH: () => util.dispatch('guiUpdate', {hide: true}),
    });
  }
  return {init};
})();
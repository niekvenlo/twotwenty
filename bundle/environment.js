  var environment = (function environmentModule() {
    'use strict';
  
    /**
     * @fileoverview Provides access to variables about the current workflow.
     */
  
    /**
     * @return {string} Description of the current workflow.
     */
    function detectWorkflow() {
      const firstButton = ー({
        name: 'First Button',
        select: 'button',
        pick: [0],
      })[0];
      const header = ー({
        name: 'Header',
        select: 'h1',
        pick: [0],
      })[0];
      const title = ー({
        name: 'Title',
        select: '.taskTitle',
        pick: [0],
      })[0];
      const buttonText = (firstButton || '') && firstButton.textContent;
      const headerText = (header || '') && header.textContent;
      const titleText = (title || '') && title.textContent;
      if (buttonText.includes('Acquire') || buttonText.includes('Continue')) {
        return 'home';
      }
      if (headerText.includes('Sitelinks')) {
        return 'sitelinks';
      }
      if (headerText.includes('Story Ads')) {
        return 'unsupported';
      }
      if (headerText.includes('Mega')) {
        return 'snippets';
      }
      if (titleText.includes('Curated Creatives')) {
        return 'as'
      }
      if (titleText.includes('Price Extension')) {
        return 'pe'
      }
      if (/#activeevals\/subpage=labels/.test(document.location.href)) {
        return 'labels';
      }
      if (headerText || titleText) {
        return 'unsupported';
      }
      return '';
    }
    
    function flowAbr(name) {
      const names = {
        home: '🏠',
        sitelinks: 'SL',
        gallery: 'GA',
        snippets: 'SS',
        as: 'AS',
        pe: 'PE',
        labels: '🏷️,'
      }
      return names[name] || '??';
    }
  
    /**
     * Checks DOM for locale indicators.
     * @return {string}
     */
    function detectLocale() {
      const header = ー({
        name: 'Header',
        select: 'h1',
        pick: [0],
      })[0];
      const headerText = header && header.textContent;
      if (!headerText) {
        return;
      }
      return headerText.trim().split(/\s+/).pop();
    }
  
    function detectTaskId() {
      const currentTask =
          Object.entries(JSON.parse(localStorage.acquiredTask))[0] ||
              ['', ''];
      return {
        encoded: currentTask[0],
        decoded: currentTask[0],
      };
    }
    
    /**
     * @return {string} String representing the current task type.
     */
    function taskType() {
      const title = document.querySelector('.taskTitle');
      if (!title) {
        return '';
      }
      if (title.textContent.includes('Analyst')) {
        return 'Analyst';
      }
      if (title.textContent.includes('Lead')) {
        return 'Reviewer';
      }
    }
    
    /**
     * Is this an Analyst Task?
     */
    function analystTask() {
      return taskType() === 'Analyst';
    }

    /**
     * Was this task analysed by you?
     *
     * @return {boolean} For a review task, are the initials of the
     * current user the first characters in the analyst comment box?
     */
    function ownTask() {
      const proxy = ref.analystComment && ref.analystComment[0];
      if (!proxy || !proxy.textContent) {
        return false;
      }
      const comment = proxy.textContent.trim();
      const initials = user.config.get('initials');
      if (!initials) {
        user.log.warn(
          `You haven't set your initials.`,
            {debug: true, print: true, save: true, toast: true},
        );
        return false;
      }
      if (new RegExp('^' + initials, 'i').test(comment)) {
        return true;
      }
      return false;
    }
  
    return {
      flowName: detectWorkflow,
      flowAbr,
      locale: detectLocale,
      taskId: detectTaskId,
      isAnalystTask: analystTask,
      isOwnTask: ownTask,
      taskType,
    };
  })();
  
flows.labels = (function labelsModule() {

  function init() {
    util.dispatch('guiUpdate', {stage: 'Waiting for data'});
    countTasks();
  }

  function countTasks() {
    try {
      let dataLoaded = false;
      const counters = {
        'Active': 0,
        'Disagreement': 0,
        'Completed': 0,
        'Pending': 0,
        'Invalidated': 0,
      };
      const letters = Object.keys(counters);
      const nums = [...document.querySelectorAll('.IX2JW6B-k-a:nth-child(7)')]
          .map(e => e.textContent);
      for (let n of nums) {
        const b = n.split(' / ');
        for (let i in b) {
          const letter = letters[i];
          const number = Number(b[i]);
          counters[letter] += number;
          if (number > 0) {
            dataLoaded = true;
          }
        }
      }
      if (!dataLoaded) {
        return false;
      }
      const mapped = Object.entries(counters).map(counter => {
        const [name, count] = counter;
        return ({flow: '', level: '', type: name, count});
      });
      util.dispatch('guiUpdate', {stage: 'Done', counters: mapped});
    } catch (e) {
      user.log.warn('Labels flow encountered an error.');
      return false;
    }
  }
  countTasks = util.retry(countTasks, 30, 1000, true);

  return {init};
})();
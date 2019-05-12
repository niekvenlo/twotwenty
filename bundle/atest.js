'use strict';

var atest = (function testModule() {

  /**
   * @fileoverview Asyncronous Testing Module
   */

  const RUN_UNSAFE_TESTS = false;
  const RUN_DELAY = 100;

  const promises = [];
  let ts;

  /**
   * Group allows you to define groups of tests, which will be turned into
   * a Promise and queued.
   * The Promises will all be run once no new tests have been defined in a
   * certain amount of time.
   *
   * @param {string} groupName - The collective name of these tests.
   * @param {Object<Function>} functions - The individual tests.
   * @param {boolean} unsafe - Is this test potentially destructive?
   */
  function group(groupName, functions, unsafe) {
    if (unsafe && !RUN_UNSAFE_TESTS) {
      return;
    }
    for (let func in functions) {
      if (typeof functions[func] !== 'function') {
        throw new TypeError('Atest requires an object with function values.');
      }
    }
    clearTimeout(ts);
    ts = setTimeout(run, RUN_DELAY);

    // Extract before/after Functions, to handle separately.
    const before = functions.before;
    delete functions.before;
    const after = functions.after;
    delete functions.after;

    // Create a Promise from each test Function.
    for (let unitName in functions) {
      const promise = (async () => {
        const testFunction = functions[unitName];
        const returnedFromBefore = before && await before();
        const success = await testFunction(returnedFromBefore);
        after && await after(returnedFromBefore);
        return {groupName, unitName, success};
      })();
      promises.push(promise);
    }
  }

  /**
   * @param {Function} func - The Test Function that will be run.
   * @param {Error=} [type = Error] The expected error the function should
   * throw.
   */
  function throws(func, type = Error) {
    try {
      func();
    } catch (e) {
      return (e instanceof type);
    }
    return false;
  }

  /**
   * Intended to be used to describe new tests before they are written.
   */
  function todo() {
  }

  /**
   * Run is automatically called when tests are defined, after a short delay.
   * It runs the Promises, and console logs the results.
   */
  async function run() {
    let testcount = 0;
    const results = await Promise.all(promises);
    const failGroups = results.filter(r => !r.success).map(r => r.groupName);
    for (let result of results) {
      testcount++;
      if (!failGroups.includes(result.groupName)) {
        continue;
      }
      console.log(
        `%c${result.groupName}/${result.unitName} ${result.success ? 'OK' : 'FAIL'}`,
        `color: ${result.success ? 'darkgreen' : 'darkred'}`
      )
    }
    const failures = failGroups.length;
    const successes = testcount - failures;
    console.log(
      `%c${testcount} tests, ${successes} successes, ${failures} failures.`,
      'color: darkblue',
    );
  }
  return {
    group,
    throws,
    todo,
  };
})();
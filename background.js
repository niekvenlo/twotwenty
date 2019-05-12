'use strict';

chrome.runtime.onMessage.addListener(openNewTabs);

/** Array of tab objects */
const tabsArray = [];

/**
 * @param {string[]} tabs - The tabs to close.
 */
async function close(tabs) {
  for (let tab of tabs) {
    const {id} = await getTab(tab) || {};
    if (!id) {
      continue;
    }
    chrome.tabs.remove(id);
  }
}

/**
 * Get up-to-date info on a tab.
 *
 * @param {Object} tab - This object may be out of data as tabs move.
 * @return {Promise} resolves to an up-to-date object.
 */
async function getTab(tab) {
  return util.doAsync(
    chrome.tabs.get,
    tab.id,
    // Checking lastError suppresses 'Not found' Errors
    () => chrome.runtime.lastError
  );
}

/**
 * Based on a set of tabs, find all related tabs.
 * In practice, this means checking whether all tabs are in the same window,
 * and closing all tabs in that window to the right of any of these tabs.
 *
 * @param {Object[]} tabs - Tab objects.
 * @param {Object[]} Tab objects, either the same as input or input plus.
 */
async function getTabsToClose(tabs) {
  const promises = tabs.map(tab => getTab(tab));
  let liveTabs = await Promise.all(promises);
  liveTabs = liveTabs.filter(tab => tab);
  const windowIds = liveTabs.map(tab => tab.windowId);
  if (new Set(windowIds).size !== 1) {
    return tabs;
  }
  const windowId = windowIds[0];
  const lowestIndex = Math.min(...liveTabs.map(tab => tab.index));
  const tabsInWindow = await util.doAsync(chrome.tabs.query, {windowId});
  return tabsInWindow.filter(tab => tab.index >= lowestIndex);
}

/**
 * @param {string[]} urls
 * @param {Object} root - The tab to use as the basis for new tabs.
 */
async function open(urls, root) {
  if (!root) {
    for (let url of urls) {
      chrome.tabs.create({url}, (tab) => tabsArray.push(tab));
    }
  } else {
    const {windowId} = await getTab(root) || {};
    for (let url of urls) {
      chrome.tabs.create({windowId, url}, (tab) => tabsArray.push(tab));
    }
  }
}

/**
 * Open urls in the same window as any existing tabs, and close existing tabs.
 *
 * @param {string[]} urls
 */
async function openNewTabs(urls) {
  const toClose = await getTabsToClose([...tabsArray]);
  const root = toClose[0];
  tabsArray.length = 0;
  open(urls, root);
  close(toClose);
}

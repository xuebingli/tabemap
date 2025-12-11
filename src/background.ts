// using global browser namespace
import { parseTabelogSearch, parseTabelogPage } from './utils/parser';

// Polyfill check if needed, but we rely on global browser
// if (typeof browser === 'undefined') { var browser = chrome; }

browser.runtime.onMessage.addListener((message: any, sender: any, sendResponse: any) => {
  if (message.type === 'FETCH_TABELOG') {
    const { name, phone } = message.payload;
    
    // Helper to log to both background console and content script
    const log = (msg: string, ...args: any[]) => {
        console.log(msg, ...args);
        if (sender.tab?.id) {
            browser.tabs.sendMessage(sender.tab.id, {
                type: 'DEBUG_LOG',
                payload: { message: msg, args }
            }).catch(() => {}); // Ignore errors (e.g. if tab closed)
        }
    };

    log(`Searching Tabelog for: ${name} (Phone: ${phone})`);

    // Strategy:
    // 1. If phone exists, search by phone (Very high accuracy)
    // 2. If phone fails or no phone, search by name
    
    // We can chain these promises.
    
    const searchByPhone = () => {
        if (!phone) return Promise.resolve(null);
        const phoneUrl = `https://tabelog.com/rstLst/?sw=${encodeURIComponent(phone)}`;
        log(`phoneUrl: ${phoneUrl}`);
        return fetch(phoneUrl)
            .then(res => res.text())
            .then(html => {
                const result = parseTabelogSearch(html);
                if (result && result.url) {
                    log('Phone match found:', result.url);
                    return result; // contains { rating, url }
                }
                return null;
            });
    };

    const searchByName = () => {
        const nameUrl = `https://tabelog.com/rstLst/?sw==${encodeURIComponent(name)}`;
        log(`nameUrl: ${nameUrl}`);
        return fetch(nameUrl)
            .then(res => res.text())
            .then(html => {
                const result = parseTabelogSearch(html);
                if (result && result.url) {
                     log('Name match found:', result.url);
                     return result;
                }
                return null;
            });
    };

    searchByPhone()
      .then(phoneResult => {
          if (phoneResult) return phoneResult;
          log('Phone search failed, trying name...');
          return searchByName();
      })
      .then(result => {
        if (!result) {
            throw new Error('No results found');
        }
        
        // If we have rating, done
        if (result.rating) {
            return result;
        }
        
        // Fetch detail
        return fetch(result.url!)
            .then(res => res.text())
            .then(html => {
                const rating = parseTabelogPage(html);
                return { rating, url: result.url };
            });
      })
      .then(data => {
         log('Sending data:', data);
         if (sender.tab?.id) {
             browser.tabs.sendMessage(sender.tab.id, {
                 type: 'TABELOG_DATA',
                 payload: { ...data, name }
             });
         }
      })
      .catch(err => {
        console.error('Tabelog fetch error:', err);
        // Ensure we send something back so UI can update to "Not Found"
        if (sender.tab?.id) {
            browser.tabs.sendMessage(sender.tab.id, {
                type: 'TABELOG_ERROR',
                payload: { name, error: err.message }
            });
        }
      });

    return true; // Indicates async response
  }
});

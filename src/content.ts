// Initial Content Script

import './styles.css';

console.log('Tabemap: Content script loaded');

let currentPlaceIdentifier: string | null = null;

const observer = new MutationObserver((mutations) => {
  // We simply check for the main heading text whenever DOM changes significantly
  // This is debounced naturally by the observer somewhat, but we should be careful.
  checkPlace();
});

function checkPlace() {
  // Google Maps uses multiple H1s. "Results" is one of them.
  // The place name is another H1, typically with class 'DUwDvf' or just distinct text.
  const headings = document.querySelectorAll('h1');
  let placeNameEl: HTMLElement | null = null;
  let placeName: string | null = null;

  for (const h1 of headings) {
      const text = h1.textContent?.trim();
      if (text && text !== 'Results' && text !== 'Google Maps' && text !== 'Tabemap') {
          // Verify visibility roughly (if hidden, it might be the wrong one)
          // But usually the active panel H1 is visible.
          if (h1.offsetParent !== null) {
             placeNameEl = h1;
             placeName = text;
             break; 
          }
      }
  }

  if (!placeNameEl || !placeName) return;

  // Double check if this is actually a place detail (look for rating/reviews nearby or specific classes)
  // For now, filtering "Results" is a huge step forward.

  // Experimental: Extract Japanese name if available (often in h2 or subtitle)
  // User suggested checking h2 > span
  const h2s = document.querySelectorAll('h2');
  let japaneseName: string | null = null;
  let japaneseNameEl: HTMLElement | null = null;
  // Regex for Japanese characters (Hiragana, Katakana, Kanji)
  const jpRegex = /[\u3000-\u303f\u3040-\u309f\u30a0-\u30ff\uff00-\uff9f\u4e00-\u9faf\u3400-\u4dbf]/;

  for (const h2 of h2s) {
      const span = h2.querySelector('span');
      if (span && span.textContent && jpRegex.test(span.textContent)) {
          japaneseName = span.textContent.trim();
          japaneseNameEl = span;
          break;
      }
      // Also check raw h2 text just in case
      if (h2.textContent && jpRegex.test(h2.textContent)) {
           japaneseName = h2.textContent.trim();
           japaneseNameEl = h2;
           break;
      }
  }

  if (japaneseName) {
      console.log('Found Japanese name:', japaneseName);
      placeName = japaneseName; // Use Japanese name for better search results
  }

  // To avoid re-fetching for the same place, check AFTER resolving the final name
  if (currentPlaceIdentifier === placeName) {
      // Re-inject if necessary (e.g. if the element reference changed or was removed)
      injectBadge(japaneseNameEl || placeNameEl);
      return;
  }
  
  // We found a new place
  console.log('Found place (final):', placeName);
  currentPlaceIdentifier = placeName;

  // Extract phone... (keep existing logic)
  let phone: string | null = null;
  // ... [keep phone logic same as before, simplified for diff] ...
  const phoneBtn = document.querySelector('button[aria-label^="Phone:"], button[aria-label^="電話:"]');
  if (phoneBtn) {
      const ariaLabel = phoneBtn.getAttribute('aria-label');
      if (ariaLabel) {
          const matches = ariaLabel.match(/(\d[\d-]+\d)/);
          if (matches) phone = matches[1];
      }
  }
  // ...

  console.log('Extracted phone:', phone);
  
  browser.runtime.sendMessage({
    type: 'FETCH_TABELOG',
    payload: {
      name: placeName,
      phone: phone
    }
  });

  // Inject placeholder
  injectBadge(japaneseNameEl || placeNameEl);
}

function injectBadge(targetTitleEl: HTMLElement) {
    // Check if already injected (look at next sibling)
    const nextFn = targetTitleEl.nextElementSibling;
    if (nextFn && nextFn.classList.contains('tabemap-rating-container')) return;

    const container = document.createElement('div');
    container.className = 'tabemap-rating-container';
    container.innerHTML = `
        <span class="tabemap-rating-badge tabemap-rating-mid">
            Loading...
        </span>
    `;
    
    // Insert after the target element
    targetTitleEl.insertAdjacentElement('afterend', container);
}

// Listen for data from background
browser.runtime.onMessage.addListener((message: any) => {
    if (message.type === 'TABELOG_DATA') {
        const { rating, url, name } = message.payload;
        console.log('Received TABELOG_DATA:', message.payload);
        console.log('Current Identifier:', currentPlaceIdentifier);
        if (currentPlaceIdentifier === name) {
            updateBadge(rating, url);
        } else {
            console.warn('Name mismatch, ignoring update.');
        }
    } else if (message.type === 'TABELOG_ERROR') {
        const { name, error } = message.payload;
        console.error('Tabemap Error:', error);
        if (currentPlaceIdentifier === name) {
            updateBadge(null, null);
        }
    } else if (message.type === 'DEBUG_LOG') {
        const { message: msg, args } = message.payload;
        console.log('[Tabemap BG]:', msg, ...args);
    }
});

function updateBadge(rating: number | null, url: string | null) {
  const badge = document.querySelector('.tabemap-rating-badge') as HTMLElement;
  if (!badge) return;

  if (rating) {
      badge.textContent = rating.toFixed(2);
      badge.className = `tabemap-rating-badge ${getRatingClass(rating)}`;
      if (url) {
          // Make it a link or wrap in link
          // The CSS assumes <a> or container behavior?
          // Let's replace the span with an anchor or wrap it.
          const link = document.createElement('a');
          link.href = url;
          link.target = '_blank';
          link.className = badge.className;
          link.innerHTML = `
             <img src="${browser.runtime.getURL('tabelog-logo.png')}" class="tabemap-rating-icon" onerror="this.style.display='none'">
             ${rating.toFixed(2)}
          `;
          badge.replaceWith(link);
      }
  } else {
      badge.textContent = 'N/A';
      badge.classList.add('tabemap-rating-low');
  }
}

function getRatingClass(rating: number): string {
    if (rating >= 3.4) return 'tabemap-rating-high';
    if (rating >= 3.3) return 'tabemap-rating-mid';
    return 'tabemap-rating-low';
}

observer.observe(document.body, { childList: true, subtree: true });


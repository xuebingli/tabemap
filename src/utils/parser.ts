export interface TabelogData {
  rating: number | null;
  url: string | null;
}

export function parseTabelogSearch(html: string): TabelogData | null {
  // Regex to find the first search result's URL and Rating
  // Structure: <a class="list-rst__rst-name-target" ... href="...">
  // Rating: <span class="c-rating__val ...">3.58</span> OR <span class="list-rst__rating-val">3.58</span>
  
  // 1. Extract URL of first result
  // Look for class containing "list-rst__rst-name-target"
  // It might be class="list-rst__rst-name-target cpy-rst-name"
  const urlRegex = /class="[^"]*list-rst__rst-name-target[^"]*"[^>]*href="([^"]*)"/i;
  const urlMatch = html.match(urlRegex);
  
  if (!urlMatch) {
    // Fallback: look for generic link inside a result container if specific class changed
    // But let's stick to specific class provided in context or common knowledge
    return null;
  }
  const url = urlMatch[1];

  // 2. Extract Rating of first result
  // We need to make sure the rating belongs to the *same* result.
  // This is hard with global regex.
  // We should try to find the block for the first result.
  
  // Find start of list item
  const listStartRegex = /class="[^"]*list-rst[^"]*"/i;
  const listStartIndex = html.search(listStartRegex);
  if (listStartIndex === -1) return { url, rating: null };
  
  // Slice HTML from that point to avoid matching previous items (if any, though search results list is usually main content)
  const slicedHtml = html.slice(listStartIndex);
  
  // Find end of generic list item or just look for next rating class closest
  // Match c-rating__val or list-rst__rating-val, usually in a span
  const ratingRegex = /class="[^"]*(?:list-rst__rating-val|c-rating__val)[^"]*"[^>]*>([\d\.]+)<\/span>/i;
  const ratingMatch = slicedHtml.match(ratingRegex);
  
  let rating: number | null = null;
  if (ratingMatch) {
    rating = parseFloat(ratingMatch[1]);
  }

  return { url, rating };
}

export function parseTabelogPage(html: string): number | null {
  // Look for .rdheader-rating__score-val
  const ratingRegex = /class="rdheader-rating__score-val"[^>]*>([\d\.]+)<\/span>/i;
  const match = html.match(ratingRegex);
  if (match) {
    return parseFloat(match[1]);
  }
  return null;
}

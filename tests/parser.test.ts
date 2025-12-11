import { describe, it, expect } from 'vitest';
import { parseTabelogSearch, parseTabelogPage } from '../src/utils/parser';

describe('Parser', () => {
  const mockSearchHtml = `
    <div class="list-rst">
        <a class="list-rst__rst-name-target" href="https://tabelog.com/tokyo/A1301/A130101/13000001/">Test Restaurant</a>
        <span class="c-rating__val">3.58</span>
    </div>
  `;

  const mockDetailHtml = `
    <span class="rdheader-rating__score-val">3.60</span>
  `;

  it('should parse search results correctly', () => {
    const result = parseTabelogSearch(mockSearchHtml);
    expect(result).not.toBeNull();
    expect(result?.url).toBe('https://tabelog.com/tokyo/A1301/A130101/13000001/');
    expect(result?.rating).toBe(3.58);
  });

  it('should parse detail page correctly', () => {
    const rating = parseTabelogPage(mockDetailHtml);
    expect(rating).toBe(3.60);
  });

  it('should return null for invalid search html', () => {
      const result = parseTabelogSearch('<div>No results</div>');
      expect(result).toBeNull();
  });
});

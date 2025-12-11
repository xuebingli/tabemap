# Product Specification: Tabemap

**Version:** 1.0
**Platform:** Firefox Browser Extension
**Date:** 2025-12-11

## 1. Overview
**Tabemap** is a Firefox browser extension designed to enhance the Google Maps experience in Japan. It automatically retrieves and displays Tabelog ratings directly on Google Maps restaurant detail panels, allowing users to cross-reference food quality scores without navigating away from their map search or switching tabs.

## 2. Functional Requirements

### 2.1 Trigger
* The extension automatically activates when a user clicks a "Place" (restaurant, cafe, izakaya, etc.) on Google Maps.
* It detects the rendering of the side panel (Place Details).

### 2.2 Data Retrieval
* **Metadata Extraction:** Parses the Google Maps DOM to extract:
    * Restaurant Name
    * Phone Number
    * Japanese Address
* **Querying:** Sends a request to Tabelog (via background script) using the **Phone Number** as the primary search key. If the phone number fails, it falls back to a **Name + Location** search.
* **Scraping:** Extracts the current star rating (out of 5.00) and the specific Tabelog URL for the venue.

### 2.3 Display
* **Injection:** Inserts a visual badge or text element into the Google Maps DOM.
* **Position:** Located immediately adjacent to the native Google Maps star rating and review count.
* **Content:** Displays the Tabelog icon and the numerical rating (e.g., "3.58").

### 2.4 Interaction
* The rating element acts as a hyperlink.
* **Click Action:** Opens the specific restaurant page on `tabelog.com` in a new tab (`target="_blank"`).

## 3. UI/UX Design

### 3.1 Visual Style
* **Minimalist:** Adopts the Google Maps font family (Roboto/Google Sans) and sizing to appear native to the interface.

### 3.2 Color Coding
The rating text or badge color changes dynamically based on the Tabelog score:

* **Red/Orange:** Rating ≥ 3.40 (High praise)
* **Standard/Neutral:** Rating < 3.40 AND Rating ≥ 3.30
* **Black/Grey:** Rating < 3.30

### 3.3 States
* **Loading:** Displays a small spinner or subtle skeleton loader while data is being fetched.
* **Error/No Match:** If the restaurant is not found on Tabelog, the element remains hidden or displays a subtle "N/A".

## 4. Technical Implementation

### 4.1 Manifest
* Format: **Manifest V3**
* Target: Firefox

### 4.2 Permissions
* `*://*.google.com/maps/*` (To monitor DOM and inject UI)
* `*://*.tabelog.com/*` (To perform cross-origin search and fetching)

### 4.3 Architecture
* **Content Script:**
    * Uses `MutationObserver` to detect when the Google Maps side panel updates.
    * Prevents duplicate injections on re-renders.
* **Background Script:**
    * Manages CORS (Cross-Origin Resource Sharing) requests to fetch Tabelog HTML.
* **Matching Logic:**
    1.  Prioritize search by **Phone Number** (Highest accuracy).
    2.  If no result, parse HTML for the fallback search.
    3.  Extract rating from the specific CSS selector (e.g., `.rdheader-rating__score-val`).

## 5. Edge Cases & Risks
* **DOM Instability:** Google Maps frequently obfuscates CSS class names. Selectors must be robust or updated regularly.
* **Mismatched Data:** Venues might exist on Google Maps but not on Tabelog, or have different phone numbers listed.
* **Rate Limiting:** High frequency of requests from a single client to Tabelog could trigger temporary IP blocks.

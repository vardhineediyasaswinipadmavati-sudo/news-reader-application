# NEWSLY — The Premier Digital Newsroom

NEWSLY is a modern, commercial-grade digital news reading platform built from scratch with **React 19**, **Vite**, **React Router 7**, **Lucide React**, and modern responsive CSS with Grid and Flexbox.

It delivers real-time journalism by integrating directly with genuine, accredited news REST APIs (GNews.io, The Guardian Open Platform, and NewsData.io) with strict adherence to editorial integrity, clean typography, client-side bookmarks, and light/dark theme persistence.

---

## Key Features

- **Editorial Brand & Aesthetic**:
  - Classic broadsheet typography paired with modern responsive layout rules.
  - High-contrast serif headlines (*Playfair Display*, *Newsreader*) and crisp sans-serif body (*Inter*).
  - Asymmetric editorial lead stories, responsive 3-column and 4-column article grids.
  - Subtle image zoom effects on hover with hairlines and borders.
  
- **Authentic News REST API Integration**:
  - Seamless support for **GNews API**, **The Guardian Open Platform**, and **NewsData.io**.
  - Normalized article structure (`id`, `title`, `description`, `content`, `imageUrl`, `publishedAt`, `source`, `author`, `category`).
  - Strict zero-fabrication policy: No fake news, fictional headlines, or invented popularity metrics.
  - Built-in in-memory caching to prevent duplicate API requests and respect rate limits.
  - Interactive API setup modal and dedicated settings interface.
  
- **Comprehensive News Sections & Categories**:
  - **World Affairs**
  - **India National**
  - **Technology**
  - **Artificial Intelligence**
  - **Business & Finance**
  - **Sports**
  - **Entertainment**
  - **Science & Space**
  - **Health & Society**

- **Real-Time Search**:
  - Live query results with result counts.
  - Search input with clear button (`X`) and keyword detection.
  - Graceful empty search and zero-results feedback.

- **Dedicated Article Details**:
  - Genuine API-provided photography with attribution caption.
  - Formatted relative and absolute publication timestamps.
  - Estimated reading time calculator.
  - One-click bookmarking and sharing.
  - Direct link to original publisher reportage.

- **Client-Side Bookmarks & Reading List**:
  - Save articles with instant visual feedback.
  - Persisted in browser `localStorage`.
  - Dedicated `/bookmarks` route with counter badge and clear-all functionality.

- **Theme Engine (Light & Dark Editions)**:
  - Morning Edition (Light): Warm parchment background (`#fbfaf6`), crisp charcoal text (`#12151a`), editorial crimson accent (`#b91c1c`).
  - Midnight Ink (Dark): Deep slate-charcoal (`#0a0d14`), parchment text (`#f8fafc`), high-contrast accent (`#ef4444`).
  - Synced with system `prefers-color-scheme` and persisted in `localStorage`.

- **Sharing**:
  - Web Share API (`navigator.share`) with automatic fallback to Clipboard API (`navigator.clipboard.writeText`) with interactive toast feedback.

- **Automated Testing Suite**:
  - Vitest and React Testing Library tests covering context providers, route navigation, search bar interactions, news cards, and API error handling.

---

## Technology Stack

| Layer | Technologies |
|---|---|
| **Framework & Build** | React 19, Vite 6 |
| **Routing** | React Router DOM v7 |
| **Icons** | Lucide React |
| **State & Context** | React Hooks (`useCallback`, `useMemo`, `useState`, `useEffect`), React Context API |
| **Styling** | Modern CSS Variables, Flexbox, CSS Grid, Responsive Media Queries |
| **Testing** | Vitest 3, React Testing Library, jsdom |

---

## Project Structure

```
new-reader-application/
├── .env.example              # Example environment configuration for news APIs
├── .gitignore                # Git ignore rules for node_modules, build & secrets
├── index.html                # Entry HTML with typography pre-connects & metadata
├── package.json              # Project dependencies and npm scripts
├── vite.config.js            # Vite and Vitest configuration
├── vitest.setup.js           # Test environment setup
├── src/
│   ├── main.jsx              # React DOM root render with Context Providers
│   ├── App.jsx               # Application shell with React Router routes
│   ├── index.css             # Design system variables, typography & base rules
│   ├── App.css               # Editorial grid, cards, navbar & detail styling
│   ├── context/
│   │   ├── ThemeContext.jsx      # Light/Dark mode state & localStorage sync
│   │   ├── BookmarksContext.jsx  # Bookmarking state & localStorage sync
│   │   └── ApiKeyContext.jsx     # API credentials & active provider state
│   ├── services/
│   │   ├── apiConfig.js          # News providers configuration & metadata
│   │   └── newsApi.js            # REST fetcher with caching, retries & normalizers
│   ├── utils/
│   │   ├── dateFormatter.js      # Masthead date, relative and full timestamps
│   │   ├── textHelpers.js        # Reading time & text truncation
│   │   └── shareHelper.js        # Web Share & Clipboard API
│   ├── components/
│   │   ├── Navbar.jsx            # Top masthead, brand, live badges, drawer
│   │   ├── Footer.jsx            # Multi-column editorial footer & attribution
│   │   ├── CategoryNav.jsx       # Category navigation bar
│   │   ├── ThemeToggle.jsx       # Light/Dark switch button
│   │   ├── SearchBar.jsx         # Debounced/submit search input with clear
│   │   ├── NewsCard.jsx          # Standard & compact editorial cards
│   │   ├── FeaturedCard.jsx      # Hero lead article card
│   │   ├── EditorialGrid.jsx     # Hero + side-stack + multi-column grid
│   │   ├── SkeletonLoader.jsx    # Shimmering editorial skeleton loaders
│   │   ├── EmptyState.jsx        # Polished empty state with action links
│   │   ├── ErrorState.jsx        # API error banner with retry & setup triggers
│   │   ├── ApiKeyModal.jsx       # Modal for setting provider & API key
│   │   ├── ShareButton.jsx       # Share/Copy trigger with feedback
│   │   └── Toast.jsx             # Ephemeral toast notifications
│   ├── pages/
│   │   ├── HomePage.jsx          # Top stories, lead story, desk shortcuts
│   │   ├── CategoryPage.jsx      # Filtered news by topic
│   │   ├── SearchPage.jsx        # Live search results
│   │   ├── ArticleDetailPage.jsx # Full article details with publisher attribution
│   │   ├── BookmarksPage.jsx     # Reading list archive
│   │   ├── SettingsPage.jsx      # Provider, credentials & data management
│   │   └── NotFoundPage.jsx      # Custom 404 page
│   └── __tests__/
│       ├── BookmarksContext.test.jsx
│       ├── ThemeContext.test.jsx
│       ├── SearchBar.test.jsx
│       ├── NewsCard.test.jsx
│       ├── newsApi.test.js
│       └── Routes.test.jsx
```

---

## Getting Started

### 1. Prerequisites
- Node.js (v18 or later, tested with v24.20.0)
- npm (v9 or later, tested with v11.19.0)

### 2. Installation
```bash
npm install
```

### 3. Configure News API Key

You can configure the API in either of two ways:

#### Option A: Via `.env` file (Recommended)
Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```
Open `.env` and set your key:
```env
VITE_NEWS_API_PROVIDER=gnews
VITE_NEWS_API_KEY=your_gnews_api_key_here
```

*Free API Key Sources:*
- **GNews.io**: Register at [https://gnews.io/](https://gnews.io/) (100 free requests/day)
- **The Guardian Open Platform**: Register at [https://open-platform.theguardian.com/](https://open-platform.theguardian.com/) (For instant developer testing, enter `test` as the key!)
- **NewsData.io**: Register at [https://newsdata.io/](https://newsdata.io/) (200 free requests/day)

#### Option B: In-App Configuration
Run the app without an `.env` file. NEWSLY will display an elegant "API Key Required" configuration modal directly in the browser where you can paste your key or select The Guardian developer key with one click. It is saved directly to your browser's `localStorage`.

### 4. Run Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

### 5. Run Automated Tests
```bash
npm test
```
Runs 15 automated unit and integration tests across 6 test suites with Vitest.

### 6. Build for Production
```bash
npm run build
```
Generates optimized, minified production assets in the `dist/` directory.

To preview the production build locally:
```bash
npm run preview
```

---

## License

Built with care for digital news readers. All news article content and photographs belong to their respective accredited publishers and news feeds.

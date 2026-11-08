/**
 * NEWSLY — Search Relevance, Disambiguation & Aggregation Engine
 *
 * Intelligent query parsing, natural language support, entity disambiguation,
 * synonym expansion, incidental-mention detection, deduplication, and ranking.
 */

// Common English stopwords to ignore when tokenizing queries
const STOPWORDS = new Set([
  'a', 'about', 'above', 'after', 'again', 'against', 'all', 'am', 'an', 'and',
  'any', 'are', 'as', 'at', 'be', 'because', 'been', 'before', 'being', 'below',
  'between', 'both', 'but', 'by', 'could', 'did', 'do', 'does', 'doing', 'down',
  'during', 'each', 'few', 'for', 'from', 'further', 'had', 'has', 'have',
  'having', 'he', 'her', 'here', 'hers', 'herself', 'him', 'himself', 'his',
  'how', 'i', 'if', 'in', 'into', 'is', 'it', 'its', 'itself', 'just', 'me',
  'more', 'most', 'my', 'myself', 'no', 'nor', 'not', 'of', 'off', 'on', 'once',
  'only', 'or', 'other', 'ought', 'our', 'ours', 'ourselves', 'out', 'over',
  'own', 'same', 'she', 'should', 'so', 'some', 'such', 'than', 'that', 'the',
  'their', 'theirs', 'them', 'themselves', 'then', 'there', 'these', 'they',
  'this', 'those', 'through', 'to', 'too', 'under', 'until', 'up', 'very',
  'was', 'we', 'were', 'what', 'when', 'where', 'which', 'while', 'who', 'whom',
  'why', 'with', 'would', 'you', 'your', 'yours', 'yourself', 'yourselves'
]);

// Search intent noise words that users type in natural language queries
// These should NOT be mandatory tokens for news articles to be considered relevant
const SEARCH_NOISE_WORDS = new Set([
  'news', 'latest', 'recent', 'today', 'breaking', 'updates', 'update',
  'articles', 'article', 'stories', 'story', 'report', 'reports', 'coverage',
  'information', 'info', 'headlines', 'headline', 'daily'
]);

/**
 * Clean and normalize text: lowercase, remove special characters, trim whitespace
 */
export function normalizeText(text) {
  if (!text || typeof text !== 'string') return '';
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Lightweight rule-based English stemmer for news terminology.
 * Handles plurals, verb conjugations, and common news keyword variations.
 */
export function getStem(word) {
  if (!word || typeof word !== 'string' || word.length <= 3) return word || '';
  const w = word.toLowerCase();

  // Known irregular news word stems
  if (w === 'technologies' || w === 'technology' || w === 'technological') return 'tech';
  if (w === 'elections' || w === 'electoral' || w === 'election') return 'elect';
  if (w === 'semiconductors' || w === 'semiconductor') return 'semiconductor';
  if (w === 'chipmakers' || w === 'chipmaker' || w === 'chips') return 'chip';
  if (w === 'investments' || w === 'investing' || w === 'investor' || w === 'investors') return 'invest';
  if (w === 'batteries' || w === 'battery') return 'batteri';
  if (w === 'economies' || w === 'economic' || w === 'economy') return 'econom';
  if (w === 'automakers' || w === 'automaker' || w === 'automobile' || w === 'automotive') return 'auto';
  if (w === 'politicians' || w === 'political' || w === 'politics') return 'polit';

  // Standard suffix stripping
  if (w.endsWith('ies') && w.length > 4) return w.slice(0, -3) + 'y';
  if (w.endsWith('ing') && w.length > 5) return w.slice(0, -3);
  if (w.endsWith('ed') && w.length > 4) return w.slice(0, -2);
  if (w.endsWith('es') && w.length > 4) return w.slice(0, -2);
  if (w.endsWith('s') && !w.endsWith('ss') && w.length > 3) return w.slice(0, -1);
  if (w.endsWith('tion') && w.length > 5) return w.slice(0, -4);
  if (w.endsWith('ment') && w.length > 5) return w.slice(0, -4);

  return w;
}

/**
 * Extract meaningful word tokens from a string (excluding standard stopwords)
 */
export function extractTokens(text) {
  const norm = normalizeText(text);
  if (!norm) return [];
  return norm
    .split(/\s+/)
    .filter((word) => word.length >= 2 && !STOPWORDS.has(word));
}

/**
 * Extract core substantive tokens excluding standard stopwords AND search intent noise words
 */
export function extractCoreTokens(text) {
  const norm = normalizeText(text);
  if (!norm) return [];
  const tokens = norm
    .split(/\s+/)
    .filter((word) => word.length >= 2 && !STOPWORDS.has(word) && !SEARCH_NOISE_WORDS.has(word));
  // If stripping search noise leaves nothing (e.g. user literally searched "latest news"), fall back to standard tokens
  return tokens.length > 0 ? tokens : extractTokens(text);
}

/**
 * Check if a word exists in text with word boundary matching
 */
export function containsWord(text, word) {
  if (!text || !word) return false;
  const escaped = word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const regex = new RegExp(`(^|[^a-zA-Z0-9_-])${escaped}([^a-zA-Z0-9_-]|$)`, 'i');
  return regex.test(text);
}

/**
 * Check if a word or its grammatical stem matches in text
 */
export function matchesTokenOrStem(text, token) {
  if (!text || !token) return false;
  if (containsWord(text, token)) return true;
  const stem = getStem(token);
  if (stem && stem.length >= 3 && containsWord(text, stem)) return true;
  return false;
}

/**
 * Check if an exact multiword phrase exists in text
 */
export function containsPhrase(text, phrase) {
  if (!text || !phrase) return false;
  const normText = normalizeText(text);
  const normPhrase = normalizeText(phrase);
  return normText.includes(normPhrase);
}

/**
 * Strip common conversational natural-language prefixes from query strings
 */
function cleanNaturalLanguageQuery(query) {
  if (!query) return '';
  let cleaned = query.trim();

  const nlPrefixes = [
    /^(latest|recent|today's|breaking|top)\s+(news|headlines|updates|stories)\s+(about|on|for|regarding|in)\s+/i,
    /^(news|updates|information|articles|stories)\s+(about|on|for|regarding|in)\s+/i,
    /^(what\s+is\s+happening\s+with|what\s+happened\s+in|what\s+is\s+happening\s+in|who\s+won|what\s+is|who\s+is|tell\s+me\s+about)\s+/i,
    /^(give\s+me\s+news\s+about|find\s+news\s+on|search\s+for)\s+/i,
  ];

  for (const regex of nlPrefixes) {
    if (regex.test(cleaned)) {
      cleaned = cleaned.replace(regex, '').trim();
      break;
    }
  }

  return cleaned;
}

/**
 * Comprehensive Knowledge Base of Entity & Topic Mappings
 */
const TOPIC_REGISTRY = [
  // 1. AP Elections (Must evaluate before general Andhra Pradesh)
  {
    id: 'AP_ELECTIONS',
    test: (q) =>
      /\bap\s+(elections?|polls?|assembly|results?)\b/i.test(q) ||
      /\b(elections?|polls?)\s+in\s+(ap|andhra(\s+pradesh)?)\b/i.test(q) ||
      /\bandhra(\s+pradesh)?\s+(assembly\s+polls?|elections?|polls?)\b/i.test(q),
    providerQuery: '"Andhra Pradesh" OR "AP elections" OR Amaravati OR Visakhapatnam OR YSRCP OR TDP',
    synonyms: ['andhra pradesh', 'amaravati', 'ysrcp', 'tdp', 'jagan', 'chandrababu', 'naidu', 'pawan kalyan', 'ap assembly', 'ap elections'],
    relatedSearches: [
      'Andhra Pradesh Assembly Elections',
      'Amaravati Capital Works',
      'TDP vs YSRCP News',
      'Pawan Kalyan Speeches',
      'AP Election Results Analysis',
      'Andhra Pradesh Voter Turnout',
    ],
    isRegionalAP: true,
  },

  // 2. Amaravati (Specific Capital / Regional Focus)
  {
    id: 'AMARAVATI',
    test: (q) => /\bamaravati\b/i.test(q),
    providerQuery: 'Amaravati OR "Amaravati capital"',
    synonyms: ['amaravati', 'andhra pradesh capital', 'crda', 'andhra pradesh'],
    focusTerm: 'amaravati',
    relatedSearches: [
      'Amaravati CRDA Master Plan',
      'Andhra Pradesh Capital Budget',
      'Vijayawada Amaravati Highway',
      'Amaravati Seed Access Road',
      'Chandrababu Naidu Amaravati',
      'AP High Court Amaravati',
    ],
    isRegionalAP: true,
  },

  // 3. Andhra Pradesh General / Regional Politics
  {
    id: 'ANDHRA_PRADESH',
    test: (q) =>
      /\b(andhra(\s+pradesh)?|visakhapatnam|vizag|vijayawada|ysrcp|tdp|jagan|chandrababu|pawan\s+kalyan)\b/i.test(q) ||
      /\bap\s+(politics|political|government|govt|elections?|polls?|assembly|results?|cabinet|news|cm|schemes?)\b/i.test(q) ||
      /\b(elections?|polls?|politics|government)\s+in\s+(ap|andhra(\s+pradesh)?)\b/i.test(q) ||
      q.toLowerCase() === 'ap politics' ||
      q.toLowerCase() === 'ap government' ||
      q.toLowerCase() === 'andhra pradesh',
    providerQuery: '"Andhra Pradesh" OR "AP politics" OR "AP government" OR Amaravati OR Visakhapatnam OR YSRCP OR TDP',
    synonyms: ['andhra pradesh', 'andhra', 'amaravati', 'visakhapatnam', 'vizag', 'vijayawada', 'ysrcp', 'tdp', 'jagan', 'chandrababu', 'naidu', 'pawan kalyan', 'jana sena', 'ap assembly', 'ap politics', 'ap govt'],
    relatedSearches: [
      'AP Politics & Government',
      'Amaravati Capital Construction',
      'Visakhapatnam IT & Port',
      'Chandrababu Naidu Announcements',
      'Pawan Kalyan Jana Sena',
      'Polavaram Project Updates',
    ],
    isRegionalAP: true,
  },

  // 4. Leaders / People: Narendra Modi
  {
    id: 'LEADER_MODI',
    test: (q) => /\b(narendra\s+modi|pm\s+modi|prime\s+minister\s+modi)\b/i.test(q) || /^\s*modi\s*$/i.test(q),
    providerQuery: '"Narendra Modi" OR "PM Modi" OR Modi',
    synonyms: ['narendra modi', 'pm modi', 'modi', 'prime minister modi', 'bjp', 'new delhi'],
    focusTerm: 'modi',
    relatedSearches: [
      'PM Modi Speeches',
      'Modi Cabinet Decisions',
      'India Foreign Policy Briefing',
      'BJP National Executive',
      'New Delhi Government Updates',
      'Make in India Semiconductor',
    ],
  },

  // 5. Companies / Organizations: Google / Alphabet
  {
    id: 'TECH_GOOGLE',
    test: (q) => /^\s*google\s*$/i.test(q) || /\b(google|alphabet\s+inc|sundar\s+pichai)\b/i.test(q),
    providerQuery: 'Google OR Alphabet',
    synonyms: ['google', 'alphabet', 'sundar pichai', 'gemini', 'android', 'pixel'],
    focusTerm: 'google',
    relatedSearches: [
      'Alphabet Quarterly Earnings',
      'Google Gemini AI',
      'Android 15 OS',
      'Sundar Pichai Keynote',
      'Google Cloud Computing',
      'Google Search AI Overview',
    ],
  },

  // 6. Companies: Tesla
  {
    id: 'TESLA',
    test: (q) => /\b(tesla|tsla|cybertruck)\b/i.test(q),
    providerQuery: 'Tesla OR TSLA OR Cybertruck',
    synonyms: ['tesla', 'tsla', 'cybertruck', 'gigafactory', 'elon musk', 'electric vehicle'],
    focusTerm: 'tesla',
    relatedSearches: [
      'Tesla Model Y Delivery',
      'Elon Musk News',
      'Electric Vehicles Market',
      'Tesla Gigafactory Expansion',
      'Cybertruck Updates',
      'EV Battery Technology',
    ],
  },

  // 7. Sports: Cricket World Cup
  {
    id: 'CRICKET_WORLD_CUP',
    test: (q) => /\b(cricket\s+world\s+cup|icc\s+world\s+cup|world\s+cup\s+cricket|cwc)\b/i.test(q),
    providerQuery: '"Cricket World Cup" OR "ICC World Cup"',
    synonyms: ['cricket world cup', 'icc world cup', 'world cup', 'cricket', 'icc', 'bcci', 'team india', 'odi', 'final'],
    focusTerm: 'world cup',
    relatedSearches: [
      'ICC World Cup Schedule',
      'India vs Australia Cricket',
      'World Cup Points Table',
      'T20 World Cup Highlights',
      'BCCI Team India Squad',
      'Cricket World Cup Final',
    ],
  },

  // 8. India Technology News
  {
    id: 'INDIA_TECHNOLOGY',
    test: (q) =>
      (/\bindia\s+(technology|tech)\b/i.test(q) ||
       /\b(technology|tech)\s+in\s+india\b/i.test(q) ||
       /\bindian?\s+(tech|technology|it\s+sector)\b/i.test(q)),
    providerQuery: 'India (technology OR tech OR semiconductor)',
    synonyms: ['india', 'indian', 'technology', 'tech', 'semiconductor', 'it sector', 'bengaluru', 'isro', 'startups', 'electronics'],
    relatedSearches: [
      'India Semiconductor Mission',
      'ISRO Space Missions',
      'Bengaluru Startup Ecosystem',
      'India AI Strategy',
      'IT Services Sector Exports',
      'Digital Public Infrastructure UPI',
    ],
  },

  // 9. India National News
  {
    id: 'INDIA_NATIONAL',
    test: (q) =>
      /\bindia\s+(news|breaking|national|politics|economy|updates?)\b/i.test(q) ||
      /\bindian?\s+(national\s+news|politics|government)\b/i.test(q) ||
      q.toLowerCase() === 'india news' ||
      q.toLowerCase() === 'india',
    providerQuery: 'India national news OR "India news"',
    synonyms: ['india', 'indian', 'delhi', 'new delhi', 'mumbai', 'modi', 'bjp', 'congress', 'parliament', 'lok sabha', 'isro', 'rbi', 'rupee'],
    relatedSearches: [
      'Lok Sabha Parliament News',
      'RBI Repo Rate Projections',
      'Supreme Court of India Rulings',
      'India Economy Growth Forecast',
      'New Delhi Policy Briefings',
      'Indian Railways Modernization',
    ],
  },

  // 10. Hyderabad
  {
    id: 'HYDERABAD',
    test: (q) => /\bhyderabad(\s+news)?\b/i.test(q),
    providerQuery: 'Hyderabad Telangana news',
    synonyms: ['hyderabad', 'telangana'],
    focusTerm: 'hyderabad',
    relatedSearches: [
      'Telangana Politics News',
      'Hyderabad Real Estate Trends',
      'HITEC City Tech Hub',
      'Hyderabad Metro Rail Expansion',
      'Telangana Economy & Budget',
      'Cyberabad Police Advisories',
    ],
  },

  // 11. World News
  {
    id: 'WORLD_NEWS',
    test: (q) => /\b(world\s+news|international\s+news|global\s+affairs)\b/i.test(q),
    providerQuery: 'world international news',
    synonyms: ['world', 'international', 'global', 'diplomacy', 'united nations'],
    relatedSearches: [
      'US Presidential Election',
      'Middle East Diplomatic Talks',
      'European Union Energy Policy',
      'Global Economic Outlook',
      'United Nations Security Council',
      'Asia Pacific Trade Accords',
    ],
  },

  // 12. Technology Desk
  {
    id: 'TECHNOLOGY',
    test: (q) =>
      q.toLowerCase() === 'technology' ||
      /\btechnology\s+news\b/i.test(q) ||
      q.toLowerCase() === 'tech news' ||
      q.toLowerCase() === 'tech',
    providerQuery: 'technology software hardware computing',
    synonyms: ['technology', 'tech', 'software', 'hardware', 'ai', 'semiconductor', 'computing', 'cybersecurity', 'cloud'],
    relatedSearches: [
      'Artificial Intelligence Frontier',
      'Semiconductor Chip Shortage',
      'Enterprise Cybersecurity',
      'Cloud Infrastructure Trends',
      'Quantum Computing Breakthroughs',
      'Consumer Tech Hardware',
    ],
  },

  // 13. Artificial Intelligence / AI
  {
    id: 'ARTIFICIAL_INTELLIGENCE',
    test: (q) =>
      /\b(artificial\s+intelligence|generative\s+ai|chatgpt|openai|anthropic|llm|llms|deep\s+learning|machine\s+learning)\b/i.test(q) ||
      q.toLowerCase() === 'ai' ||
      /\bai\s+(models?|chips?|safety|startups?|tools?|agents?|news)\b/i.test(q),
    providerQuery: '"Artificial Intelligence" OR "Generative AI" OR AI',
    synonyms: ['artificial intelligence', 'ai', 'generative ai', 'openai', 'chatgpt', 'anthropic', 'claude', 'gemini', 'deepmind', 'llm', 'machine learning', 'deep learning', 'neural network', 'superintelligence', 'agi'],
    focusTerm: 'ai',
    relatedSearches: [
      'Generative AI Models',
      'OpenAI ChatGPT Updates',
      'Anthropic Claude Reasoning',
      'AI Chips & Hardware',
      'Machine Learning Research',
      'AI Safety & Governance',
    ],
  },

  // 14. India Cricket
  {
    id: 'INDIA_CRICKET',
    test: (q) =>
      /\b(india\s+cricket|indian\s+cricket|bcci|ipl|team\s+india\s+cricket)\b/i.test(q) ||
      (/\bcricket\b/i.test(q) && /\bindia\b/i.test(q)),
    providerQuery: '"Indian cricket" OR BCCI OR IPL OR "Team India cricket"',
    synonyms: ['cricket', 'bcci', 'ipl', 'team india', 'rohit sharma', 'virat kohli'],
    relatedSearches: [
      'IPL 2026 Schedule',
      'BCCI Team India News',
      'Rohit Sharma Captaincy',
      'Virat Kohli Batting Stats',
      'India Test Match Series',
      'ICC World Test Championship',
    ],
  },

  // 15. Semiconductor Industry
  {
    id: 'SEMICONDUCTORS',
    test: (q) => /\b(semiconductors?|chipmakers?|tsmc|nvidia\s+chips?|intel\s+foundry|microchips?)\b/i.test(q),
    providerQuery: 'semiconductor OR chipmakers OR TSMC OR microchips',
    synonyms: ['semiconductor', 'semiconductors', 'chip', 'chips', 'chipmaker', 'foundry', 'tsmc', 'intel'],
    relatedSearches: [
      'TSMC Foundry Expansion',
      'Nvidia AI Accelerators',
      'Intel Core Ultra Processors',
      'Silicon Wafer Manufacturing',
      'Global Chip Subsidies',
      'ASML Lithography Tech',
    ],
  },

  // 16. Electric Vehicles
  {
    id: 'ELECTRIC_VEHICLES',
    test: (q) => /\b(electric\s+vehicles?|ev\s+market|evs|ev\s+charging|battery\s+vehicles?)\b/i.test(q) || /^\s*ev\s*$/i.test(q) || /^\s*evs\s*$/i.test(q),
    providerQuery: '"electric vehicles" OR EV OR EVs OR "electric car"',
    synonyms: ['electric vehicle', 'electric vehicles', 'ev', 'evs', 'charging', 'battery', 'automaker'],
    focusTerm: 'ev',
    relatedSearches: [
      'EV Charging Station Network',
      'Solid State EV Batteries',
      'Tesla Cybertruck & Model Y',
      'Clean Transport Subsidies',
      'Electric Two-Wheelers Market',
      'Hybrid vs Electric Cars',
    ],
  },

  // 17. Apple Inc.
  {
    id: 'TECH_APPLE',
    test: (q) => /^\s*apple\s*$/i.test(q) || /\b(apple|aapl|iphone|tim\s+cook|ipad|macbook)\b/i.test(q),
    providerQuery: 'Apple OR iPhone OR "Tim Cook"',
    synonyms: ['apple', 'iphone', 'tim cook', 'ipad', 'macbook', 'ios', 'apple intelligence'],
    focusTerm: 'apple',
    relatedSearches: [
      'Apple Vision Pro Ecosystem',
      'iPhone 16 Pro Updates',
      'Tim Cook Keynote Address',
      'iOS Next-Gen Features',
      'Apple Intelligence AI',
      'MacBook M4 Silicon',
    ],
  },

  // 18. Microsoft
  {
    id: 'TECH_MICROSOFT',
    test: (q) => /^\s*microsoft\s*$/i.test(q) || /\b(microsoft|satya\s+nadella|windows\s+11|copilot)\b/i.test(q),
    providerQuery: 'Microsoft OR "Satya Nadella"',
    synonyms: ['microsoft', 'satya nadella', 'copilot', 'azure', 'windows'],
    focusTerm: 'microsoft',
    relatedSearches: [
      'Microsoft Copilot Workspace',
      'Azure Cloud Revenue Growth',
      'Satya Nadella Keynote',
      'Windows 11 AI Integration',
      'OpenAI Microsoft Alliance',
      'Xbox Gaming Industry',
    ],
  },

  // 19. Nvidia
  {
    id: 'TECH_NVIDIA',
    test: (q) => /\b(nvidia|nvda|jensen\s+huang)\b/i.test(q),
    providerQuery: 'Nvidia OR NVDA OR "Jensen Huang"',
    synonyms: ['nvidia', 'nvda', 'jensen huang', 'gpu', 'ai chips'],
    focusTerm: 'nvidia',
    relatedSearches: [
      'Nvidia Blackwell Architecture',
      'Jensen Huang Keynote',
      'AI Data Center Infrastructure',
      'Nvidia Quarterly Earnings',
      'CUDA Developer Platform',
      'Enterprise GPU Clusters',
    ],
  },

  // 20. ISRO
  {
    id: 'ISRO',
    test: (q) => /\b(isro|chandrayaan|gaganyaan|indian\s+space\s+research)\b/i.test(q),
    providerQuery: 'ISRO OR Chandrayaan OR "Indian Space Research"',
    synonyms: ['isro', 'chandrayaan', 'gaganyaan', 'space', 'satellite'],
    focusTerm: 'isro',
    relatedSearches: [
      'ISRO Gaganyaan Human Spaceflight',
      'Chandrayaan 4 Lunar Mission',
      'Aditya L1 Solar Research',
      'SSLV Commercial Rocket Launches',
      'Indian Private Space Startups',
      'NASA ISRO NISAR Satellite',
    ],
  },

  // 21. Cybersecurity
  {
    id: 'CYBERSECURITY',
    test: (q) => /\b(cybersecurity|cyber\s+security|infosec|ransomware|malware|data\s+breach)\b/i.test(q),
    providerQuery: 'cybersecurity OR ransomware OR "data breach"',
    synonyms: ['cybersecurity', 'cyber security', 'infosec', 'ransomware', 'malware', 'breach', 'hacker'],
    relatedSearches: [
      'Zero Day Threat Reports',
      'Ransomware Attack Trends',
      'Cloud Security Posture',
      'CISA Advisory Bulletins',
      'Data Breach Forensics',
      'AI in Cybersecurity Defense',
    ],
  },

  // 22. Clean Energy
  {
    id: 'CLEAN_ENERGY',
    test: (q) => /\b(clean\s+energy|renewable\s+energy|solar\s+power|wind\s+energy|green\s+hydrogen)\b/i.test(q),
    providerQuery: '"clean energy" OR "renewable energy" OR solar',
    synonyms: ['clean energy', 'renewable energy', 'solar', 'wind', 'green hydrogen'],
    relatedSearches: [
      'Solar Photovoltaic Efficiency',
      'Green Hydrogen Initiatives',
      'Offshore Wind Farm Projects',
      'Grid Energy Storage Batteries',
      'Nuclear SMR Technology',
      'Renewable Energy Transition',
    ],
  },

  // 23. Global Markets / Wall Street
  {
    id: 'GLOBAL_MARKETS',
    test: (q) => /\b(global\s+markets|stock\s+markets?|wall\s+street|equities|sensex|nifty|inflation)\b/i.test(q),
    providerQuery: '"global markets" OR "stock market" OR "Wall Street"',
    synonyms: ['markets', 'stocks', 'wall street', 'sensex', 'nifty', 'inflation', 'equities'],
    relatedSearches: [
      'Federal Reserve Interest Rates',
      'Wall Street Stock Rally',
      'US Treasury Bond Yields',
      'Global Inflation Indicators',
      'Sensex Nifty Record Highs',
      'OPEC Crude Oil Production',
    ],
  },
];

/**
 * Generate 5–6 relevant search suggestions based on the user's current search query.
 * Suggestions include related topics, synonyms, entities, and specific subtopics.
 * If relevant suggestions cannot be generated (e.g. invalid/gibberish query), returns an empty array.
 */
export function getRelatedSearches(query) {
  if (!query || typeof query !== 'string') return [];
  const clean = query.trim();
  if (!clean || clean.length < 2) return [];

  const processed = processSearchQuery(clean);
  const naturalCore = processed.coreQuery || clean;
  const lowerQuery = clean.toLowerCase();
  const lowerCore = naturalCore.toLowerCase();

  // Find matching topic in registry
  let suggestions = [];

  const matched = TOPIC_REGISTRY.find(
    (t) => t.test(clean) || (naturalCore && t.test(naturalCore))
  );

  if (matched && Array.isArray(matched.relatedSearches)) {
    suggestions = matched.relatedSearches;
  }

  // Filter out any suggestion that is identical (case-insensitive) to current query
  const filtered = suggestions.filter((s) => {
    const sLower = s.toLowerCase();
    return sLower !== lowerQuery && sLower !== lowerCore;
  });

  // Return exactly 5–6 suggestions if available; otherwise empty array (Requirement 8)
  if (filtered.length >= 4) {
    return filtered.slice(0, 6);
  }

  return [];
}

/**
 * Process raw user search query to detect structure, natural-language intents,
 * phrases, synonyms, and entity categories.
 */
export function processSearchQuery(rawQuery) {
  if (!rawQuery || typeof rawQuery !== 'string') {
    return {
      rawQuery: '',
      cleanQuery: '',
      coreQuery: '',
      normalized: '',
      tokens: [],
      coreTokens: [],
      phrases: [],
      entityType: 'GENERIC',
      effectiveProviderQuery: '',
      synonymKeywords: [],
      focusTerm: null,
      isRegionalAP: false,
    };
  }

  const cleanQuery = rawQuery.trim().replace(/\s+/g, ' ');
  const naturalCore = cleanNaturalLanguageQuery(cleanQuery);
  const lowerQuery = cleanQuery.toLowerCase();
  const tokens = extractTokens(cleanQuery);
  const coreTokens = extractCoreTokens(naturalCore || cleanQuery);

  // Extract quoted phrases e.g. "artificial intelligence"
  const quotedMatches = cleanQuery.match(/"([^"]+)"/g) || [];
  const phrases = quotedMatches.map((m) => m.replace(/"/g, '').trim());

  // Check Topic & Entity Registry
  let entityType = 'GENERIC';
  let effectiveProviderQuery = naturalCore || cleanQuery;
  let synonymKeywords = [];
  let focusTerm = null;
  let isRegionalAP = false;

  for (const entry of TOPIC_REGISTRY) {
    if (entry.test(cleanQuery) || (naturalCore && entry.test(naturalCore))) {
      entityType = entry.id;
      effectiveProviderQuery = entry.providerQuery;
      synonymKeywords = entry.synonyms || [];
      focusTerm = entry.focusTerm || null;
      isRegionalAP = Boolean(entry.isRegionalAP);
      break;
    }
  }

  // If no registry match, format effective query safely:
  // If multi-word without quotes, wrap as exact phrase or clean terms to avoid over-restrictive GNews AND matching
  if (entityType === 'GENERIC') {
    if (coreTokens.length > 1 && !cleanQuery.includes('"')) {
      effectiveProviderQuery = coreTokens.join(' ');
    }
  }

  return {
    rawQuery: cleanQuery,
    cleanQuery,
    coreQuery: naturalCore,
    normalized: lowerQuery,
    tokens,
    coreTokens,
    phrases: phrases.length > 0 ? phrases : [naturalCore || cleanQuery],
    entityType,
    effectiveProviderQuery,
    synonymKeywords,
    focusTerm,
    isRegionalAP,
  };
}

/**
 * Score an individual article's relevance against a processed search query.
 * Returns an object with numerical score (0 to 100), boolean isRelevant, and diagnostics.
 */
export function scoreArticleRelevance(article, processedQuery) {
  if (!article || !processedQuery || !processedQuery.normalized) {
    return { score: 0, isRelevant: false, reason: 'Invalid input' };
  }

  const title = article.title || '';
  const desc = article.description || '';
  const content = article.content || '';
  const sourceName = (article.source && article.source.name) ? article.source.name : '';

  const normTitle = normalizeText(title);
  const normDesc = normalizeText(desc);
  const normContent = normalizeText(content);
  const normSource = normalizeText(sourceName);

  const {
    normalized: query,
    rawQuery,
    coreQuery,
    coreTokens,
    entityType,
    synonymKeywords = [],
    focusTerm = null,
    isRegionalAP = false,
  } = processedQuery;

  // -------------------------------------------------------------
  // 1. SPECIALIZED REGIONAL & ENTITY INTEGRITY CHECKS
  // -------------------------------------------------------------

  // Rule A: Andhra Pradesh / AP Regional & Politics
  if (isRegionalAP || entityType === 'ANDHRA_PRADESH' || entityType === 'AP_ELECTIONS' || entityType === 'AMARAVATI') {
    // Explicit negative check: Arunachal Pradesh is NOT Andhra Pradesh
    const isArunachal =
      (containsPhrase(normTitle, 'arunachal') || containsPhrase(normDesc, 'arunachal')) &&
      !containsPhrase(normTitle, 'andhra') && !containsPhrase(normDesc, 'andhra');
    if (isArunachal) {
      return {
        score: 0,
        isRelevant: false,
        reason: 'Arunachal Pradesh story is not relevant to Andhra Pradesh',
        isIncidental: true,
      };
    }

    const andhraKeywords = [
      'andhra', 'andhra pradesh', 'amaravati', 'ysrcp', 'tdp', 'jagan',
      'chandrababu', 'naidu', 'pawan kalyan', 'jana sena', 'vijayawada',
      'visakhapatnam', 'vizag', 'ap assembly', 'ap election', 'ap elections', 'ap politics',
      'ap govt', 'ap government', 'ap cabinet', 'tirupati', 'guntur', 'kurnool',
      'nellore', 'kadapa', 'anantapur', 'lok sabha', 'assembly polls', 'constituency', 'y s jagan'
    ];

    const hasAndhraInTitle = andhraKeywords.some((kw) => containsPhrase(normTitle, kw) || containsWord(normTitle, kw));
    const hasAndhraInBody = andhraKeywords.some((kw) => containsPhrase(normDesc, kw) || containsPhrase(normContent, kw));

    // Check for false-positive wire agency: "Associated Press" or "(AP)" covering US/foreign stories
    const isWireAttribution =
      normSource.includes('associated press') ||
      normSource.includes('ap news') ||
      /\(ap\)/i.test(title) ||
      /\(ap\)/i.test(desc) ||
      /\bap\s+reports\b/i.test(desc) ||
      /\bby\s+the\s+associated\s+press\b/i.test(desc);

    const isUsForeignElection =
      containsPhrase(normTitle, 'us election') ||
      containsPhrase(normTitle, 'trump') ||
      containsPhrase(normTitle, 'biden') ||
      containsPhrase(normTitle, 'harris') ||
      containsPhrase(normTitle, 'democrats') ||
      containsPhrase(normTitle, 'republicans') ||
      containsPhrase(normTitle, 'white house') ||
      containsPhrase(normTitle, 'senate') ||
      containsPhrase(normTitle, 'congressional') ||
      containsPhrase(normTitle, 'presidential election') ||
      containsPhrase(normTitle, 'pennsylvania') ||
      containsPhrase(normTitle, 'michigan') ||
      containsPhrase(normTitle, 'french election') ||
      containsPhrase(normTitle, 'macron') ||
      containsPhrase(normTitle, 'uk election');

    // If it's an Associated Press wire or foreign election report without Andhra Pradesh context: REJECT with 0
    if ((isUsForeignElection || isWireAttribution) && !hasAndhraInTitle && !hasAndhraInBody) {
      return {
        score: 0,
        isRelevant: false,
        reason: 'Associated Press wire or unrelated foreign report without Andhra Pradesh context',
        isIncidental: true,
      };
    }

    // Specific focus check for Amaravati searches:
    // If user specifically searched for Amaravati, ensure Amaravati is covered
    if (entityType === 'AMARAVATI') {
      const hasAmaravatiInTitle = containsWord(normTitle, 'amaravati') || containsPhrase(normTitle, 'amaravati');
      const hasAmaravatiInDesc = containsWord(normDesc, 'amaravati') || containsPhrase(normDesc, 'amaravati');
      if (hasAmaravatiInTitle) {
        return { score: 96, isRelevant: true, reason: 'Headline directly covers Amaravati', isIncidental: false };
      }
      if (hasAmaravatiInDesc) {
        return { score: 80, isRelevant: true, reason: 'Amaravati capital coverage confirmed in article', isIncidental: false };
      }
      // If zero Amaravati mention at all:
      return { score: 10, isRelevant: false, reason: 'Does not cover Amaravati specifically', isIncidental: true };
    }

    if (hasAndhraInTitle) {
      return {
        score: 95,
        isRelevant: true,
        reason: 'Direct Andhra Pradesh coverage in headline',
        isIncidental: false,
      };
    }

    if (hasAndhraInBody) {
      return {
        score: 75,
        isRelevant: true,
        reason: 'Andhra Pradesh regional context confirmed in article',
        isIncidental: false,
      };
    }

    return {
      score: 0,
      isRelevant: false,
      reason: 'No genuine Andhra Pradesh connection found',
      isIncidental: true,
    };
  }

  // Rule B: India National News vs Indiana / Indianapolis
  if (entityType === 'INDIA_NATIONAL') {
    const isIndianaOrUnrelated =
      (containsPhrase(normTitle, 'indiana') || containsPhrase(normTitle, 'indianapolis')) &&
      !containsPhrase(normTitle, 'india');
    if (isIndianaOrUnrelated) {
      return { score: 0, isRelevant: false, reason: 'Refers to Indiana or Indianapolis, not India', isIncidental: true };
    }

    const indianKeywords = [
      'india', 'indian', 'delhi', 'new delhi', 'mumbai', 'modi', 'bjp', 'congress',
      'parliament', 'lok sabha', 'rajya sabha', 'supreme court of india', 'isro',
      'rbi', 'reserve bank of india', 'rupee', 'nirmala sitharaman', 'amit shah',
      'rahul gandhi', 'indian army', 'indian railways'
    ];

    const hasIndiaInTitle = indianKeywords.some((kw) => containsWord(normTitle, kw) || containsPhrase(normTitle, kw));
    const hasIndiaInDesc = indianKeywords.some((kw) => containsWord(normDesc, kw) || containsPhrase(normDesc, kw));

    if (hasIndiaInTitle) {
      return { score: 92, isRelevant: true, reason: 'Headline directly covers Indian national affairs', isIncidental: false };
    }
    if (hasIndiaInDesc) {
      return { score: 72, isRelevant: true, reason: 'Article summary focuses on Indian national news', isIncidental: false };
    }
    return { score: 12, isRelevant: false, reason: 'Lacks genuine Indian national news substance', isIncidental: true };
  }

  // Rule C: Tesla Primary Subject vs Incidental Mention
  if (entityType === 'TESLA') {
    const isTeslaInTitle =
      containsWord(title, 'Tesla') ||
      containsWord(title, 'TSLA') ||
      containsWord(title, 'Cybertruck') ||
      containsWord(title, 'Gigafactory');

    if (isTeslaInTitle) {
      return {
        score: 92,
        isRelevant: true,
        reason: 'Tesla is the primary subject in headline',
        isIncidental: false,
      };
    }

    // Tesla NOT in title: check for incidental list mention vs genuine EV story
    const countInDesc = (normDesc.match(/\btesla\b/g) || []).length;
    const countInContent = (normContent.match(/\btesla\b/g) || []).length;
    const totalMentions = countInDesc + countInContent;

    const unrelatedTitleSubjects = [
      'biden', 'trump', 'harris', 'white house', 'senate', 'congress',
      'apple', 'google', 'amazon', 'spacex', 'meta', 'boeing', 'oil',
      'climate change', 'clean energy act', 'tax credits', 'supreme court'
    ];
    const hasOtherTitleSubject = unrelatedTitleSubjects.some((s) => containsPhrase(normTitle, s));

    if (totalMentions <= 1 || (hasOtherTitleSubject && totalMentions < 3)) {
      return {
        score: 18,
        isRelevant: false,
        reason: 'Tesla is only an incidental secondary mention in an article about another subject',
        isIncidental: true,
      };
    }

    const hasEvContext =
      containsPhrase(normDesc, 'electric vehicle') ||
      containsPhrase(normDesc, 'ev') ||
      containsPhrase(normDesc, 'elon musk') ||
      containsPhrase(normDesc, 'automaker') ||
      containsPhrase(normDesc, 'supercharger');

    if (totalMentions >= 2 && hasEvContext) {
      return {
        score: 65,
        isRelevant: true,
        reason: 'Substantive Tesla coverage in lead description',
        isIncidental: false,
      };
    }

    return {
      score: 22,
      isRelevant: false,
      reason: 'Insufficient focus on Tesla',
      isIncidental: true,
    };
  }

  // Rule D: Artificial Intelligence
  if (entityType === 'ARTIFICIAL_INTELLIGENCE') {
    const aiPrimaryKeywords = [
      'artificial intelligence', 'generative ai', 'openai', 'chatgpt',
      'anthropic', 'claude', 'gemini', 'deepmind', 'llm', 'large language model',
      'machine learning', 'neural network', 'deep learning', 'ai model',
      'ai chip', 'ai safety', 'superintelligence', 'agi'
    ];

    const hasAiInTitle =
      aiPrimaryKeywords.some((kw) => containsPhrase(normTitle, kw)) ||
      containsWord(title, 'AI');

    if (hasAiInTitle) {
      return {
        score: 90,
        isRelevant: true,
        reason: 'Artificial Intelligence is the primary focus in headline',
        isIncidental: false,
      };
    }

    const countAiInDesc = aiPrimaryKeywords.filter((kw) => containsPhrase(normDesc, kw)).length;
    const hasAiWordInDesc = containsWord(desc, 'AI');

    const isGadgetOrUnrelatedTitle =
      containsPhrase(normTitle, 'smartphone') ||
      containsPhrase(normTitle, 'camera') ||
      containsPhrase(normTitle, 'laptop') ||
      containsPhrase(normTitle, 'crypto') ||
      containsPhrase(normTitle, 'bitcoin') ||
      containsPhrase(normTitle, 'gaming');

    if (isGadgetOrUnrelatedTitle && countAiInDesc === 0) {
      return {
        score: 15,
        isRelevant: false,
        reason: 'AI mentioned only as a secondary feature in hardware/crypto story',
        isIncidental: true,
      };
    }

    if (countAiInDesc >= 2 || (countAiInDesc >= 1 && hasAiWordInDesc)) {
      return {
        score: 60,
        isRelevant: true,
        reason: 'Substantive AI discussion in article summary',
        isIncidental: false,
      };
    }

    return {
      score: 20,
      isRelevant: false,
      reason: 'Lacks core Artificial Intelligence substance',
      isIncidental: true,
    };
  }

  // -------------------------------------------------------------
  // 2. GENERAL & MULTI-WORD QUERY RELEVANCE ENGINE
  // -------------------------------------------------------------

  const searchTargetPhrase = normalizeText(coreQuery || rawQuery);
  const searchCleanPhrase = normalizeText(rawQuery);

  const isExactPhraseInTitle =
    (searchTargetPhrase && containsPhrase(normTitle, searchTargetPhrase)) ||
    (searchCleanPhrase && containsPhrase(normTitle, searchCleanPhrase));

  const isExactPhraseInDesc =
    (searchTargetPhrase && containsPhrase(normDesc, searchTargetPhrase)) ||
    (searchCleanPhrase && containsPhrase(normDesc, searchCleanPhrase));

  const activeTokens = coreTokens.length > 0 ? coreTokens : extractTokens(rawQuery);
  if (activeTokens.length === 0) {
    return { score: 0, isRelevant: false, reason: 'Empty query tokens' };
  }

  const titleMatchedTokens = activeTokens.filter((t) => matchesTokenOrStem(normTitle, t));
  const descMatchedTokens = activeTokens.filter((t) => matchesTokenOrStem(normDesc, t));
  const contentMatchedTokens = activeTokens.filter((t) => matchesTokenOrStem(normContent, t));

  const titleMatchRatio = activeTokens.length > 0 ? titleMatchedTokens.length / activeTokens.length : 0;
  const descMatchRatio = activeTokens.length > 0 ? descMatchedTokens.length / activeTokens.length : 0;
  const descTokenRatio = descMatchRatio;

  let score = 0;

  // A. Headline Matching (Primary Factor — Max 65 Points)
  if (isExactPhraseInTitle) {
    score += 65;
  } else if (titleMatchRatio === 1) {
    score += 54;
  } else if (titleMatchRatio >= 0.5) {
    score += Math.round(titleMatchRatio * 44);
  } else if (titleMatchedTokens.length > 0) {
    score += 18;
  }

  // B. Description Matching (Secondary Factor — Max 32 Points)
  if (isExactPhraseInDesc) {
    score += 32;
  } else if (descTokenRatio === 1) {
    score += 20;
  } else if (descTokenRatio >= 0.5) {
    score += Math.round(descTokenRatio * 16);
  } else if (descMatchedTokens.length > 0) {
    score += 8;
  }

  // C. Content & Supporting Context (Max 10 Points)
  if (contentMatchedTokens.length >= activeTokens.length) {
    score += 10;
  } else if (contentMatchedTokens.length > 0) {
    score += 5;
  }

  // D. Synonym / Alternate Wording Support
  const hasSynonymInTitle = synonymKeywords.length > 0 &&
    synonymKeywords.some((kw) => containsPhrase(normTitle, kw) || containsWord(normTitle, kw));
  const hasSynonymInDesc = synonymKeywords.length > 0 &&
    synonymKeywords.some((kw) => containsPhrase(normDesc, kw) || containsWord(normDesc, kw));

  if (hasSynonymInTitle) {
    score += 48;
  }
  if (hasSynonymInDesc) {
    score += 18;
  }

  // E. Specific Focus Term Bonus (e.g. Amaravati, Modi, Google)
  if (focusTerm) {
    if (containsWord(normTitle, focusTerm) || containsPhrase(normTitle, focusTerm)) {
      score += 20;
    } else if (containsWord(normDesc, focusTerm) || containsPhrase(normDesc, focusTerm)) {
      score += 10;
    }
  }

  // F. Incidental Mention Penalties
  // If NO query token appeared in the headline AND no synonym in headline:
  const hasAnyHeadlineMatch = titleMatchedTokens.length > 0 || hasSynonymInTitle;

  if (!hasAnyHeadlineMatch) {
    // If the description contains the full exact phrase, apply only light penalty (-12)
    // If it only has fragmented tokens without headline presence, apply strict penalty (-24)
    score -= isExactPhraseInDesc ? 12 : 24;
  }

  // If combined token match across title + desc is low for multi-word queries:
  const uniqueMatchedTokens = new Set([...titleMatchedTokens, ...descMatchedTokens]);
  if (activeTokens.length >= 2 && !isExactPhraseInDesc && !hasSynonymInTitle && (uniqueMatchedTokens.size / activeTokens.length) < 0.5) {
    score -= 25;
  }

  // Normalize score bounds (0 - 100)
  score = Math.max(0, Math.min(100, score));

  // Minimum threshold for passing relevance: 28 / 100
  const MIN_RELEVANCE_THRESHOLD = 28;
  const isRelevant = score >= MIN_RELEVANCE_THRESHOLD;

  let reason = 'Relevant news story';
  if (!isRelevant) {
    if (titleMatchedTokens.length === 0 && descMatchedTokens.length <= 1) {
      reason = 'Incidental or passing reference only';
    } else {
      reason = 'Low query term concentration';
    }
  }

  return {
    score,
    isRelevant,
    reason,
    isIncidental: !isRelevant,
    matchedTokens: Array.from(uniqueMatchedTokens),
  };
}

/**
 * Filter, score, and rank search results by relevance and publication recency.
 */
export function filterAndRankSearchResults(articles, rawQuery, options = {}) {
  const { minScore = 28, maxResults = 50 } = options;
  const processedQuery = processSearchQuery(rawQuery);

  if (!Array.isArray(articles) || articles.length === 0) {
    return {
      articles: [],
      totalFound: 0,
      relevantCount: 0,
      filteredCount: 0,
      query: processedQuery.rawQuery,
      entityType: processedQuery.entityType,
    };
  }

  const scoredArticles = [];
  let filteredCount = 0;

  for (const art of articles) {
    const evaluation = scoreArticleRelevance(art, processedQuery);
    if (evaluation.isRelevant && evaluation.score >= minScore) {
      scoredArticles.push({
        ...art,
        _relevanceScore: evaluation.score,
        _relevanceReason: evaluation.reason,
      });
    } else {
      filteredCount++;
    }
  }

  // Rank by relevance score descending. When relevance is comparable (within 12 points),
  // prioritize publication recency (newest first).
  scoredArticles.sort((a, b) => {
    const scoreA = a._relevanceScore || 0;
    const scoreB = b._relevanceScore || 0;
    const diff = scoreB - scoreA;

    // Strong relevance difference takes strict precedence
    if (Math.abs(diff) >= 12) {
      return diff;
    }

    // Comparable relevance: newer article wins
    const timeA = new Date(a.publishedAt).getTime();
    const timeB = new Date(b.publishedAt).getTime();
    const validA = !isNaN(timeA);
    const validB = !isNaN(timeB);

    if (validA && validB && timeA !== timeB) {
      return timeB - timeA;
    }

    return diff;
  });

  const finalArticles = scoredArticles.slice(0, maxResults);

  return {
    articles: finalArticles,
    totalFound: articles.length,
    relevantCount: finalArticles.length,
    filteredCount,
    query: processedQuery.rawQuery,
    entityType: processedQuery.entityType,
  };
}

/**
 * Deduplicate articles by normalized URL and title similarity.
 * Preserves the article with the richer image and description.
 */
export function deduplicateArticles(articles) {
  if (!Array.isArray(articles) || articles.length === 0) return [];

  const seenUrls = new Set();
  const seenTitleWords = [];
  const uniqueArticles = [];

  for (const art of articles) {
    if (!art || !art.title) continue;

    // 1. Check exact URL
    const normUrl = (art.url || '').split('?')[0].replace(/\/+$/, '').toLowerCase();
    if (normUrl && seenUrls.has(normUrl)) {
      continue;
    }

    // 2. Check title similarity
    const titleTokens = extractTokens(art.title);
    if (titleTokens.length >= 3) {
      const isDuplicateTitle = seenTitleWords.some((prevTokens) => {
        const overlap = titleTokens.filter((t) => prevTokens.includes(t)).length;
        const similarity = overlap / Math.max(titleTokens.length, prevTokens.length);
        return similarity >= 0.78; // 78%+ shared distinctive tokens = duplicate story
      });

      if (isDuplicateTitle) {
        continue;
      }
    }

    if (normUrl) seenUrls.add(normUrl);
    if (titleTokens.length >= 3) seenTitleWords.push(titleTokens);
    uniqueArticles.push(art);
  }

  return uniqueArticles;
}

/**
 * Format feed for cross-publisher diversity so readers get varied viewpoints.
 * Prevents more than maxConsecutive articles in a row from the same publisher.
 */
export function diversifyPublishers(articles, maxConsecutive = 2) {
  if (!Array.isArray(articles) || articles.length <= 2) return articles;

  const result = [];
  const deferred = [];
  let currentPublisher = '';
  let consecutiveCount = 0;

  for (const art of articles) {
    const pub = (art.source && art.source.name) ? art.source.name.trim().toLowerCase() : 'other';

    if (pub === currentPublisher) {
      if (consecutiveCount < maxConsecutive) {
        result.push(art);
        consecutiveCount++;
      } else {
        deferred.push(art);
      }
    } else {
      result.push(art);
      currentPublisher = pub;
      consecutiveCount = 1;

      // Check if we can reinsert one deferred article from a different publisher
      if (deferred.length > 0) {
        const insertIdx = deferred.findIndex(
          (d) => ((d.source && d.source.name) ? d.source.name.trim().toLowerCase() : '') !== currentPublisher
        );
        if (insertIdx !== -1) {
          const [reinserted] = deferred.splice(insertIdx, 1);
          result.push(reinserted);
          currentPublisher = (reinserted.source && reinserted.source.name) ? reinserted.source.name.trim().toLowerCase() : '';
          consecutiveCount = 1;
        }
      }
    }
  }

  // Append any remaining deferred articles at the end
  return [...result, ...deferred];
}

/**
 * Validate that an article genuinely matches a specific category desk to prevent contamination.
 */
export function isArticleRelevantToCategory(article, categoryId) {
  if (!article || !categoryId) return true;
  const id = categoryId.toLowerCase();
  const title = article.title || '';
  const desc = article.description || '';
  const text = `${title} ${desc} ${article.content || ''}`.toLowerCase();

  // 1. Andhra Pradesh Category Isolation
  if (id === 'andhra-pradesh') {
    // Explicit negative check: Arunachal Pradesh is NOT Andhra Pradesh
    if (text.includes('arunachal') && !text.includes('andhra')) return false;

    const apTerms = [
      'andhra', 'andhra pradesh', 'amaravati', 'visakhapatnam', 'vijayawada',
      'ysrcp', 'tdp', 'chandrababu', 'naidu', 'jagan', 'pawan kalyan', 'jana sena',
      'ap govt', 'ap government', 'ap assembly', 'ap cabinet', 'tirupati', 'guntur',
      'kurnool', 'nellore', 'kadapa', 'anantapur', 'y s jagan'
    ];
    return apTerms.some((t) => text.includes(t));
  }

  // 2. India Category Isolation
  if (id === 'india') {
    if (text.includes('indiana') && !text.includes('india')) return false;
    const indiaTerms = [
      'india', 'indian', 'delhi', 'new delhi', 'mumbai', 'modi', 'bjp', 'congress',
      'lok sabha', 'parliament', 'isro', 'rbi', 'rupee', 'bengaluru', 'chennai',
      'kolkata', 'hyderabad'
    ];
    return indiaTerms.some((t) => text.includes(t));
  }

  // 3. AI Category Isolation
  if (id === 'ai') {
    const aiTerms = [
      'artificial intelligence', 'generative ai', 'openai', 'chatgpt', 'anthropic',
      'claude', 'gemini', 'deepmind', 'llm', 'machine learning', 'neural network',
      'deep learning', 'superintelligence', 'agi', 'copilot'
    ];
    const hasAiTerm = aiTerms.some((t) => text.includes(t));
    const hasAiWord = containsWord(title, 'AI') || containsWord(desc, 'AI');
    return hasAiTerm || hasAiWord;
  }

  // 4. Technology Isolation (filter out pure general politics or business with no tech)
  if (id === 'technology') {
    const techTerms = [
      'technology', 'tech', 'software', 'hardware', 'ai', 'artificial intelligence',
      'neural network', 'neural networks', 'transformer', 'deep learning', 'machine learning',
      'model', 'models', 'superintelligence', 'semiconductor', 'chip', 'chips', 'computing',
      'cybersecurity', 'internet', 'app', 'apps', 'smartphone', 'robotics', 'cloud', 'quantum',
      'algorithm', 'gadget', 'crypto', 'blockchain', 'apple', 'google', 'microsoft', 'nvidia',
      'meta', 'samsung', 'intel', 'amd', 'telecom', 'code', 'data center'
    ];
    return techTerms.some((t) => text.includes(t));
  }

  return true;
}

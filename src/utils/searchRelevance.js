/**
 * NEWSLY — Search Relevance, Disambiguation & Aggregation Engine
 *
 * Strict relevance filtering, query parsing, entity disambiguation,
 * incidental-mention detection, deduplication, and publisher diversity.
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
 * Extract meaningful word tokens from a string
 */
export function extractTokens(text) {
  const norm = normalizeText(text);
  if (!norm) return [];
  return norm
    .split(/\s+/)
    .filter((word) => word.length >= 2 && !STOPWORDS.has(word));
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
 * Check if an exact multiword phrase exists in text
 */
export function containsPhrase(text, phrase) {
  if (!text || !phrase) return false;
  const normText = normalizeText(text);
  const normPhrase = normalizeText(phrase);
  return normText.includes(normPhrase);
}

/**
 * Process raw user search query to detect structure, phrases, and entity intent.
 */
export function processSearchQuery(rawQuery) {
  if (!rawQuery || typeof rawQuery !== 'string') {
    return {
      rawQuery: '',
      normalized: '',
      tokens: [],
      phrases: [],
      entityType: 'GENERIC',
      effectiveProviderQuery: '',
    };
  }

  const cleanQuery = rawQuery.trim().replace(/\s+/g, ' ');
  const lowerQuery = cleanQuery.toLowerCase();
  const tokens = extractTokens(cleanQuery);

  // Extract quoted phrases e.g. "artificial intelligence"
  const quotedMatches = cleanQuery.match(/"([^"]+)"/g) || [];
  const phrases = quotedMatches.map((m) => m.replace(/"/g, '').trim());

  // Entity and Topic Disambiguation
  let entityType = 'GENERIC';
  let effectiveProviderQuery = cleanQuery;

  // 1. Andhra Pradesh Regional & Politics
  const isApElections =
    (/\bap\s+(elections?|polls?|assembly|results?)\b/i.test(cleanQuery) ||
     /\b(elections?|polls?)\s+in\s+(ap|andhra(\s+pradesh)?)\b/i.test(cleanQuery) ||
     /\bandhra(\s+pradesh)?\s+(assembly\s+polls?|elections?|polls?)\b/i.test(cleanQuery));

  const isAndhraPradeshQuery =
    (/\b(andhra(\s+pradesh)?|amaravati|visakhapatnam|vijayawada|ysrcp|tdp|jagan|chandrababu|pawan\s+kalyan)\b/i.test(cleanQuery) ||
     /\bap\s+(politics|political|government|govt|elections?|polls?|assembly|results?|cabinet|news|cm|schemes?)\b/i.test(cleanQuery) ||
     /\b(elections?|polls?|politics|government)\s+in\s+(ap|andhra(\s+pradesh)?)\b/i.test(cleanQuery) ||
     cleanQuery.trim().toLowerCase() === 'ap politics' ||
     cleanQuery.trim().toLowerCase() === 'ap government' ||
     cleanQuery.trim().toLowerCase() === 'andhra pradesh');

  if (isApElections) {
    entityType = 'AP_ELECTIONS';
    effectiveProviderQuery = '"Andhra Pradesh" OR "AP elections" OR Amaravati OR Visakhapatnam OR YSRCP OR TDP';
  } else if (isAndhraPradeshQuery) {
    entityType = 'ANDHRA_PRADESH';
    effectiveProviderQuery = '"Andhra Pradesh" OR "AP politics" OR "AP government" OR Amaravati OR Visakhapatnam OR YSRCP OR TDP';
  }
  // 2. India National News
  else if (
    /\bindia\s+(news|breaking|national|politics|economy|updates?)\b/i.test(cleanQuery) ||
    /\bindian?\s+(national\s+news|politics|government)\b/i.test(cleanQuery) ||
    cleanQuery.trim().toLowerCase() === 'india news'
  ) {
    entityType = 'INDIA_NATIONAL';
    effectiveProviderQuery = 'India national news OR "India news"';
  }
  // 3. Hyderabad News
  else if (/\bhyderabad(\s+news)?\b/i.test(cleanQuery)) {
    entityType = 'HYDERABAD';
    effectiveProviderQuery = 'Hyderabad Telangana news';
  }
  // 4. World News
  else if (/\b(world\s+news|international\s+news|global\s+affairs)\b/i.test(cleanQuery)) {
    entityType = 'WORLD_NEWS';
    effectiveProviderQuery = 'world international news';
  }
  // 5. Technology Desk
  else if (
    cleanQuery.trim().toLowerCase() === 'technology' ||
    /\btechnology\s+news\b/i.test(cleanQuery) ||
    cleanQuery.trim().toLowerCase() === 'tech news'
  ) {
    entityType = 'TECHNOLOGY';
    effectiveProviderQuery = 'technology software hardware computing';
  }
  // 6. Tesla / TSLA
  else if (/\b(tesla|tsla|cybertruck)\b/i.test(cleanQuery)) {
    entityType = 'TESLA';
  }
  // 7. Artificial Intelligence / AI
  else if (
    /\b(artificial\s+intelligence|generative\s+ai|chatgpt|openai|anthropic|llm|llms|deep\s+learning|machine\s+learning)\b/i.test(cleanQuery) ||
    cleanQuery.trim().toLowerCase() === 'ai' ||
    /\bai\s+(models?|chips?|safety|startups?|tools?|agents?|news)\b/i.test(cleanQuery)
  ) {
    entityType = 'ARTIFICIAL_INTELLIGENCE';
  }
  // 8. India Cricket
  else if (
    /\b(india\s+cricket|indian\s+cricket|bcci|ipl|team\s+india\s+cricket)\b/i.test(cleanQuery) ||
    (/\bcricket\b/i.test(cleanQuery) && /\bindia\b/i.test(cleanQuery))
  ) {
    entityType = 'INDIA_CRICKET';
  }
  // 9. Semiconductor Industry
  else if (/\b(semiconductors?|chipmakers?|tsmc|nvidia\s+chips?|intel\s+foundry)\b/i.test(cleanQuery)) {
    entityType = 'SEMICONDUCTORS';
  }

  return {
    rawQuery: cleanQuery,
    normalized: lowerQuery,
    tokens,
    phrases: phrases.length > 0 ? phrases : [cleanQuery],
    entityType,
    effectiveProviderQuery,
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

  const { normalized: query, tokens, entityType } = processedQuery;

  // -------------------------------------------------------------
  // SPECIALIZED ENTITY DISAMBIGUATION RULES
  // -------------------------------------------------------------

  // Rule 1: Andhra Pradesh / AP Regional & Politics
  if (entityType === 'ANDHRA_PRADESH' || entityType === 'AP_ELECTIONS') {
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
      'visakhapatnam', 'ap assembly', 'ap election', 'ap elections', 'ap politics',
      'ap govt', 'ap government', 'ap cabinet', 'tirupati', 'guntur', 'kurnool',
      'nellore', 'kadapa', 'anantapur', 'lok sabha', 'assembly polls', 'constituency', 'y s jagan'
    ];

    const hasAndhraContextInTitle = andhraKeywords.some((kw) => containsPhrase(normTitle, kw));
    const hasAndhraContextInBody = andhraKeywords.some((kw) => containsPhrase(normDesc, kw) || containsPhrase(normContent, kw));

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
      containsPhrase(normTitle, 'uk election');

    // If it's a US/foreign election or general wire where AP is just the wire reporter,
    // and there is ZERO Andhra Pradesh context: REJECT with 0 score!
    if ((isUsForeignElection || isWireAttribution) && !hasAndhraContextInTitle && !hasAndhraContextInBody) {
      return {
        score: 0,
        isRelevant: false,
        reason: 'Associated Press wire or unrelated foreign report without Andhra Pradesh context',
        isIncidental: true,
      };
    }

    if (hasAndhraContextInTitle) {
      return {
        score: 95,
        isRelevant: true,
        reason: 'Direct Andhra Pradesh coverage in headline',
        isIncidental: false,
      };
    }

    if (hasAndhraContextInBody) {
      return {
        score: 75,
        isRelevant: true,
        reason: 'Andhra Pradesh regional context confirmed in article',
        isIncidental: false,
      };
    }

    // No Andhra context found at all
    return {
      score: 0,
      isRelevant: false,
      reason: 'No genuine Andhra Pradesh connection found',
      isIncidental: true,
    };
  }

  // Rule 2: India National News
  if (entityType === 'INDIA_NATIONAL') {
    const indianKeywords = [
      'india', 'indian', 'delhi', 'new delhi', 'mumbai', 'modi', 'bjp', 'congress',
      'parliament', 'lok sabha', 'rajya sabha', 'supreme court of india', 'isro',
      'rbi', 'reserve bank of india', 'rupee', 'nirmala sitharaman', 'amit shah',
      'rahul gandhi', 'indian army', 'indian railways'
    ];

    const isIndianaOrUnrelated =
      (containsPhrase(normTitle, 'indiana') || containsPhrase(normTitle, 'indianapolis')) &&
      !containsPhrase(normTitle, 'india');
    if (isIndianaOrUnrelated) {
      return { score: 0, isRelevant: false, reason: 'Refers to Indiana or Indianapolis, not India', isIncidental: true };
    }

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

  // Rule 3: Hyderabad News
  if (entityType === 'HYDERABAD') {
    const hasHydInTitle = containsWord(normTitle, 'hyderabad') || containsPhrase(normTitle, 'hyderabad');
    const hasHydInDesc = containsWord(normDesc, 'hyderabad') || containsPhrase(normDesc, 'telangana');
    if (hasHydInTitle) return { score: 95, isRelevant: true, reason: 'Direct Hyderabad coverage in headline', isIncidental: false };
    if (hasHydInDesc) return { score: 75, isRelevant: true, reason: 'Hyderabad / Telangana context confirmed', isIncidental: false };
    return { score: 10, isRelevant: false, reason: 'No Hyderabad context found', isIncidental: true };
  }

  // Rule 4: Technology Desk
  if (entityType === 'TECHNOLOGY') {
    const techKeywords = [
      'technology', 'tech', 'software', 'hardware', 'ai', 'artificial intelligence',
      'semiconductor', 'chip', 'chips', 'computing', 'cybersecurity', 'internet',
      'app', 'apps', 'smartphone', 'robotics', 'cloud', 'quantum', 'algorithm',
      'gadget', 'crypto', 'blockchain', 'apple', 'google', 'microsoft', 'nvidia'
    ];
    const hasTechInTitle = techKeywords.some((kw) => containsWord(normTitle, kw) || containsPhrase(normTitle, kw));
    const hasTechInDesc = techKeywords.some((kw) => containsWord(normDesc, kw) || containsPhrase(normDesc, kw));
    if (hasTechInTitle) return { score: 88, isRelevant: true, reason: 'Headline focuses directly on technology', isIncidental: false };
    if (hasTechInDesc) return { score: 68, isRelevant: true, reason: 'Article summary covers technology', isIncidental: false };
    return { score: 18, isRelevant: false, reason: 'General business or politics without tech substance', isIncidental: true };
  }

  // Rule 2: Tesla
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

    // Tesla NOT in title: inspect description and content for substance vs incidental mention
    const countInDesc = (normDesc.match(/\btesla\b/g) || []).length;
    const countInContent = (normContent.match(/\btesla\b/g) || []).length;
    const totalMentions = countInDesc + countInContent;

    // Check if article is primarily about another distinct topic (e.g. Biden policy, Apple, General EV bill)
    const unrelatedTitleSubjects = [
      'biden', 'trump', 'harris', 'white house', 'senate', 'congress',
      'apple', 'google', 'amazon', 'spacex', 'meta', 'boeing', 'oil',
      'climate change', 'clean energy act', 'tax credits', 'supreme court'
    ];
    const hasOtherTitleSubject = unrelatedTitleSubjects.some((s) => containsPhrase(normTitle, s));

    // If Tesla is mentioned only once in a list ("companies like Ford, GM and Tesla")
    // or as a fleeting comparison, reject as incidental!
    if (totalMentions <= 1 || (hasOtherTitleSubject && totalMentions < 3)) {
      return {
        score: 18,
        isRelevant: false,
        reason: 'Tesla is only an incidental secondary mention in an article about another subject',
        isIncidental: true,
      };
    }

    // Multi-mention in description and content with substantive EV context
    const hasEvContext =
      containsPhrase(normDesc, 'electric vehicle') ||
      containsPhrase(normDesc, 'ev') ||
      containsPhrase(normDesc, 'elon musk') ||
      containsPhrase(normDesc, 'automaker') ||
      containsPhrase(normDesc, 'autopilot') ||
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

  // Rule 3: Artificial Intelligence
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

    // Not in title: check if description is deeply focused on AI
    const countAiInDesc = aiPrimaryKeywords.filter((kw) => containsPhrase(normDesc, kw)).length;
    const hasAiWordInDesc = containsWord(desc, 'AI');

    // Reject incidental mentions (e.g. gadget review mentioning "AI camera" once)
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
  // GENERAL QUERY RELEVANCE SCORING
  // -------------------------------------------------------------

  let score = 0;
  const isExactPhraseInTitle = containsPhrase(normTitle, query);
  const isExactPhraseInDesc = containsPhrase(normDesc, query);

  if (tokens.length === 0) {
    return { score: 0, isRelevant: false, reason: 'Empty query tokens' };
  }

  // 1. Title Token Overlap (Max 60 points)
  const titleMatchedTokens = tokens.filter((t) => containsWord(normTitle, t));
  const titleMatchRatio = titleMatchedTokens.length / tokens.length;

  if (isExactPhraseInTitle) {
    score += 60;
  } else if (titleMatchRatio === 1) {
    score += 52;
  } else if (titleMatchRatio >= 0.5) {
    score += Math.round(titleMatchRatio * 40);
  } else if (titleMatchedTokens.length > 0) {
    score += 15;
  }

  // 2. Description Token Overlap (Max 30 points)
  const descMatchedTokens = tokens.filter((t) => containsWord(normDesc, t));
  const descMatchRatio = descMatchedTokens.length / tokens.length;

  if (isExactPhraseInDesc) {
    score += 30;
  } else if (descMatchRatio === 1) {
    score += 24;
  } else if (descMatchRatio >= 0.5) {
    score += Math.round(descMatchRatio * 18);
  } else if (descMatchedTokens.length > 0) {
    score += 8;
  }

  // 3. Content / Source Support (Max 10 points)
  const contentMatchedTokens = tokens.filter((t) => containsWord(normContent, t));
  if (contentMatchedTokens.length >= tokens.length) {
    score += 10;
  } else if (contentMatchedTokens.length > 0) {
    score += 5;
  }

  // 4. Incidental Mention Penalties
  // If NO query token appeared in title at all:
  if (titleMatchedTokens.length === 0) {
    score -= 25; // Strict penalty: headlines define relevance in news media
  }

  // If combined token match across title + desc is less than 50% of the query:
  const totalUniqueMatches = new Set([...titleMatchedTokens, ...descMatchedTokens]).size;
  if (totalUniqueMatches / tokens.length < 0.5) {
    score -= 30;
  }

  // Normalize score bounds (0 - 100)
  score = Math.max(0, Math.min(100, score));

  // Minimum threshold for passing relevance: 32 / 100
  const MIN_RELEVANCE_THRESHOLD = 32;
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
    matchedTokens: Array.from(new Set([...titleMatchedTokens, ...descMatchedTokens])),
  };
}

/**
 * Filter, score, and rank search results by relevance and publication recency.
 */
export function filterAndRankSearchResults(articles, rawQuery, options = {}) {
  const { minScore = 32, maxResults = 50 } = options;
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

  // Sort by relevance score descending, then by publication date descending
  scoredArticles.sort((a, b) => {
    const diff = (b._relevanceScore || 0) - (a._relevanceScore || 0);
    if (Math.abs(diff) >= 15) return diff; // Strong relevance takes precedence

    // If relevance is comparable, newer article wins
    const timeA = new Date(a.publishedAt).getTime();
    const timeB = new Date(b.publishedAt).getTime();
    return (isNaN(timeB) ? 0 : timeB) - (isNaN(timeA) ? 0 : timeA);
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

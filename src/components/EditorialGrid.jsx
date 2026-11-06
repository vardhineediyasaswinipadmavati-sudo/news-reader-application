import React from 'react';
import FeaturedCard from './FeaturedCard';
import NewsCard from './NewsCard';

export default function EditorialGrid({
  articles = [],
  showHero = true,
  columns = 3,
  className = '',
}) {
  if (!articles || articles.length === 0) return null;

  if (showHero && articles.length >= 3) {
    const heroArticle = articles[0];
    const sideArticles = articles.slice(1, 3);
    const remainingArticles = articles.slice(3);

    return (
      <div className={`editorial-layout-wrapper ${className}`}>
        {/* Hero + Secondary Side Stack */}
        <div className="hero-editorial-grid">
          <FeaturedCard article={heroArticle} />
          <div className="hero-side-stack">
            {sideArticles.map((art) => (
              <NewsCard key={art.id} article={art} variant="standard" />
            ))}
          </div>
        </div>

        {/* Remaining Grid */}
        {remainingArticles.length > 0 && (
          <div className={columns === 4 ? 'news-cards-grid-4' : 'news-cards-grid'}>
            {remainingArticles.map((art) => (
              <NewsCard key={art.id} article={art} variant="standard" />
            ))}
          </div>
        )}
      </div>
    );
  }

  // Standard multi-column grid
  return (
    <div className={columns === 4 ? 'news-cards-grid-4' : 'news-cards-grid'}>
      {articles.map((art) => (
        <NewsCard key={art.id} article={art} variant="standard" />
      ))}
    </div>
  );
}

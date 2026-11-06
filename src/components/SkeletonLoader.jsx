import React from 'react';

export function NewsCardSkeleton() {
  return (
    <div className="news-card-standard" aria-hidden="true">
      <div className="skeleton" style={{ aspectRatio: '16/10', width: '100%' }} />
      <div className="news-card-content">
        <div className="skeleton" style={{ width: '30%', height: '12px', marginBottom: '0.6rem' }} />
        <div className="skeleton skeleton-title" />
        <div className="skeleton skeleton-text" />
        <div className="skeleton skeleton-text" style={{ width: '70%' }} />
        <div style={{ marginTop: 'auto', paddingTop: '0.8rem', borderTop: '1px solid var(--border-subtle)', display: 'flex', justifyContent: 'space-between' }}>
          <div className="skeleton" style={{ width: '35%', height: '12px' }} />
          <div className="skeleton" style={{ width: '20%', height: '12px' }} />
        </div>
      </div>
    </div>
  );
}

export function FeaturedHeroSkeleton() {
  return (
    <div className="featured-hero-card" aria-hidden="true">
      <div className="skeleton skeleton-hero" />
      <div className="featured-hero-content">
        <div className="skeleton" style={{ width: '20%', height: '14px', marginBottom: '0.8rem' }} />
        <div className="skeleton skeleton-title" style={{ height: '32px', width: '92%' }} />
        <div className="skeleton skeleton-title" style={{ height: '32px', width: '60%' }} />
        <div className="skeleton skeleton-text" style={{ marginTop: '0.5rem' }} />
        <div className="skeleton skeleton-text" style={{ width: '80%' }} />
        <div style={{ marginTop: 'auto', paddingTop: '1rem', borderTop: '1px solid var(--border-subtle)', display: 'flex', justifyContent: 'space-between' }}>
          <div className="skeleton" style={{ width: '25%', height: '14px' }} />
          <div className="skeleton" style={{ width: '15%', height: '14px' }} />
        </div>
      </div>
    </div>
  );
}

export function EditorialGridSkeleton({ count = 6 }) {
  return (
    <div className="news-cards-grid" aria-label="Loading stories...">
      {Array.from({ length: count }).map((_, i) => (
        <NewsCardSkeleton key={i} />
      ))}
    </div>
  );
}

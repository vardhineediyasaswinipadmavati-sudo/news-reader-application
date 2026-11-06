import React from 'react';
import { NavLink } from 'react-router-dom';
import { CATEGORIES } from '../services/apiConfig';

export default function CategoryNav({ className = '', onLinkClick }) {
  return (
    <nav className={`category-nav-wrapper ${className}`} aria-label="News categories">
      <div className="container">
        <div className="category-nav">
          <NavLink
            to="/"
            end
            className={({ isActive }) => `category-link ${isActive ? 'active' : ''}`}
            onClick={onLinkClick}
          >
            All News
          </NavLink>
          {CATEGORIES.map((cat) => (
            <NavLink
              key={cat.id}
              to={`/category/${cat.id}`}
              className={({ isActive }) => `category-link ${isActive ? 'active' : ''}`}
              onClick={onLinkClick}
            >
              {cat.label}
            </NavLink>
          ))}
        </div>
      </div>
    </nav>
  );
}

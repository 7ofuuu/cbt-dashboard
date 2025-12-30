import React from 'react';

/**
 * PageHeader Component
 * Reusable component for consistent page headers across the application
 * 
 * @param {string} title - Main page title (h1)
 * @param {string} description - Optional description text below title
 * @param {React.ReactNode} children - Optional additional content (e.g., buttons)
 */
export function PageHeader({ title, description, children }) {
    return (
        <div className="flex items-start justify-between mb-6">
            <div>
                <h1 className="text-3xl font-bold text-gray-900 mb-2">{title}</h1>
                {description && <p className="text-gray-600">{description}</p>}
            </div>
            {children && <div className="flex-shrink-0">{children}</div>}
        </div>
    );
}

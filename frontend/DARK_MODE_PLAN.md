# Production Dark Mode Implementation Plan

This document outlines the rigorous, production-level strategy for introducing Dark Mode into the Stoxy Finance frontend. Because Stoxy utilizes a highly specific "Academic Brutalist" design system, we cannot simply invert colors. We must carefully map light utility tokens to corresponding dark tokens using CSS variables, preserving the sharp contrast, hard borders, and subtle textures (like the grid background).

## 1. Core Architecture Strategy: CSS Variables + Tailwind

Instead of littering React components with Tailwind's `dark:` modifiers (e.g., `bg-white dark:bg-black text-black dark:text-white`), we will use **CSS Variables** defined at the `:root` level.

### Why this approach?
1. **Maintainability:** Changing `text-black/60` across 100 components to `dark:text-white/60` is error-prone. With CSS variables, `text-primary` automatically becomes white in dark mode.
2. **Performance:** The browser handles CSS variable recalculation natively; React doesn't need to re-render to switch themes.

## 2. Tailwind Configuration Overhaul (`tailwind.config.cjs`)

We will rewire Tailwind to point to our custom CSS variables.

```javascript
module.exports = {
  darkMode: 'class', // Triggered by adding 'dark' class to <html>
  theme: {
    extend: {
      colors: {
        // Backgrounds
        base: 'var(--color-bg-base)',       // The main page background
        surface: 'var(--color-bg-surface)', // Card backgrounds (currently white)
        neutral: 'var(--color-bg-neutral)', // Light gray areas (currently neutral/40)
        
        // Text & Outlines
        primary: 'var(--color-text-primary)', // Replaces text-black
        muted: 'var(--color-text-muted)',     // Replaces text-black/60
        border: 'var(--color-border)',        // Replaces border-black/10
        
        // Semantic Colors
        positive: 'var(--color-positive)',    // e.g., #2E7D32
        negative: 'var(--color-negative)',    // e.g., #DC2626
      }
    }
  }
}
```

## 3. Global CSS Variable Definitions (`src/styles/globals.css`)

Here we map the exact hex/rgba values for both themes.

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  :root {
    /* LIGHT THEME (Current Stoxy Aesthetics) */
    --color-bg-base: #F8F9FA; /* Or whatever the current bg-base is */
    --color-bg-surface: #FFFFFF;
    --color-bg-neutral: rgba(0, 0, 0, 0.04);
    
    --color-text-primary: #000000;
    --color-text-muted: rgba(0, 0, 0, 0.6);
    --color-border: rgba(0, 0, 0, 0.1);
    
    --color-positive: #2E7D32;
    --color-negative: #DC2626;

    /* Grid Texture */
    --grid-color: rgba(0, 0, 0, 0.03);
    
    /* Academic Shadow */
    --shadow-academic: 0 4px 24px -1px rgba(0, 0, 0, 0.1);
  }

  .dark {
    /* DARK THEME (Brutalist Dark) */
    --color-bg-base: #0A0A0A; /* Very deep, almost OLED black */
    --color-bg-surface: #141414; /* Slightly elevated card color */
    --color-bg-neutral: rgba(255, 255, 255, 0.05);
    
    --color-text-primary: #EDEDED; /* Off-white prevents eye strain */
    --color-text-muted: rgba(255, 255, 255, 0.55);
    --color-border: rgba(255, 255, 255, 0.12);
    
    --color-positive: #4ADE80; /* Lighter green for dark mode contrast */
    --color-negative: #F87171; /* Lighter red for dark mode contrast */

    /* Grid Texture */
    --grid-color: rgba(255, 255, 255, 0.02);
    
    /* Academic Shadow */
    /* Dark mode shadows are invisible; we use a subtle harsh border instead to maintain brutality */
    --shadow-academic: 0 0 0 1px rgba(255, 255, 255, 0.08); 
  }
}

/* Redefining custom utility classes */
.academic-shadow {
  box-shadow: var(--shadow-academic);
  background-color: var(--color-bg-surface);
}

.check-light-grid {
  background-image: linear-gradient(var(--grid-color) 1px, transparent 1px),
    linear-gradient(90deg, var(--grid-color) 1px, transparent 1px);
  background-size: 32px 32px;
}
```

## 4. Theme State Management Context (`src/context/ThemeContext.tsx`)

We need a React Context to manage the state, persist it to `localStorage`, and apply the `.dark` class to the HTML document.

```tsx
import { createContext, useContext, useEffect, useState } from 'react';

type Theme = 'light' | 'dark' | 'system';

interface ThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  isDark: boolean;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<Theme>(() => 
    (localStorage.getItem('stoxy-theme') as Theme) || 'system'
  );

  const isDark = theme === 'dark' || 
    (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);

  useEffect(() => {
    const root = window.document.documentElement;
    root.classList.remove('light', 'dark');
    root.classList.add(isDark ? 'dark' : 'light');
    localStorage.setItem('stoxy-theme', theme);
  }, [theme, isDark]);

  return (
    <ThemeContext.Provider value={{ theme, setTheme, isDark }}>
      {children}
    </ThemeContext.Provider>
  );
}

export const useTheme = () => {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider');
  return ctx;
};
```

## 5. UI Implementation & Refactoring

### A. The Theme Toggle (`Header.tsx`)
Add a highly visible toggle in the header.
```tsx
import { Moon, Sun } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';

// Inside Header component:
const { theme, setTheme, isDark } = useTheme();

<button 
  onClick={() => setTheme(isDark ? 'light' : 'dark')}
  className="p-2 rounded-full hover:bg-neutral transition-colors text-primary"
>
  {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
</button>
```

### B. Global Search & Replace Phase
The most labor-intensive part of the implementation. We must replace hardcoded utilities across the app.
- Search: `text-black` -> Replace: `text-primary`
- Search: `text-black/60`, `text-black/70` -> Replace: `text-muted`
- Search: `bg-white` -> Replace: `bg-surface`
- Search: `border-black/5`, `border-black/10` -> Replace: `border-border`
- Search: `bg-neutral/30`, `bg-neutral/40` -> Replace: `bg-neutral`

### C. Chart Adjustments (Recharts)
Recharts relies on inline SVG props for colors, meaning Tailwind classes won't directly work for the stroke/fill of `Area` or `Line` components unless configured properly.
In `Dashboard.tsx` and `StockDetails.tsx`:
```tsx
const { isDark } = useTheme();
const chartColor = isUp 
  ? (isDark ? '#4ADE80' : '#2E7D32') 
  : (isDark ? '#F87171' : '#DC2626');

// Apply to Recharts <Area stroke={chartColor} ... />
```

## 6. Testing & QA Protocol
1. **Flash of Unstyled Content (FOUC) Test:** Hard refresh the application in Dark Mode. If it briefly flashes white before turning black, we need to inject a tiny blocking script in `index.html` `<head>` to read `localStorage` instantly before React hydrates.
2. **Contrast Checks:** Ensure `text-muted` (the faded text used for metadata) passes WCAG AA contrast ratio against `bg-surface` (#141414).
3. **PDF Export Verification:** Ensure that the Portfolio's "Export to PDF" backend endpoint still generates a readable PDF with a white background, regardless of the user's frontend theme preference.

## 7. Execution Order for Next Session
1. Create `ThemeContext.tsx` and wrap `App.tsx`.
2. Update `globals.css` with the CSS variables.
3. Update `tailwind.config.cjs`.
4. Add the toggle button to `Header.tsx`.
5. Execute the massive "Search & Replace" regex for classes across `src/components/pages/*`.
6. Fix Recharts colors via the `useTheme()` hook.

import { useEffect, useState } from 'react';

/**
 * Hook to detect the user's preferred color scheme (light or dark).
 * Uses the prefers-color-scheme media query for web environments.
 */
export function useColorScheme(): 'light' | 'dark' | null {
    const [colorScheme, setColorScheme] = useState<'light' | 'dark' | null>(null);

    useEffect(() => {
        // Check if we're in a browser environment
        if (typeof window === 'undefined') return;

        const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

        const updateColorScheme = () => {
            setColorScheme(mediaQuery.matches ? 'dark' : 'light');
        };

        // Set initial value
        updateColorScheme();

        // Listen for changes
        mediaQuery.addEventListener('change', updateColorScheme);

        return () => mediaQuery.removeEventListener('change', updateColorScheme);
    }, []);

    return colorScheme;
}

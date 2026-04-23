import { useEffect, useState } from 'react';
import { EffectiveTheme, useEffectiveTheme } from '@/contexts/ThemeContext';

/**
 * To support static rendering, this value needs to be re-calculated on the client side for web
 */
export function useColorScheme(): EffectiveTheme {
    const [hasHydrated, setHasHydrated] = useState(false);
    const effective = useEffectiveTheme();

    useEffect(() => {
        setHasHydrated(true);
    }, []);

    return hasHydrated ? effective : 'light';
}

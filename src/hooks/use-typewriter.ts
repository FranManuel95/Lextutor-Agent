import { useState, useEffect } from 'react';

export function useTypewriter(text: string, enabled: boolean = true, speed: number = 10) {
    const [displayedText, setDisplayedText] = useState(enabled ? '' : text);

    useEffect(() => {
        if (!enabled) {
            setDisplayedText(text);
            return;
        }

        // If caught up, or text shrank (e.g. error/reset), sync immediately
        if (displayedText.length >= text.length) {
            if (displayedText.length > text.length) {
                setDisplayedText(text);
            }
            return;
        }

        const timeout = setTimeout(() => {
            // Adaptive speed: catch up faster if far behind
            const distance = text.length - displayedText.length;
            let step = 1;

            if (distance > 100) step = 10;
            else if (distance > 50) step = 5;
            else if (distance > 20) step = 2;

            setDisplayedText((prev) => text.slice(0, prev.length + step));
        }, speed);

        return () => clearTimeout(timeout);
    }, [text, displayedText, enabled, speed]);

    return displayedText;
}

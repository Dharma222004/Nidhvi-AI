import { useState, useEffect } from 'react';

/**
 * Hook to create a typing effect for strings
 * @param {string} text - The text to type
 * @param {number} speed - Typing speed in ms (default 30)
 * @param {boolean} active - Whether the effect is active
 */
export const useTypewriter = (text, speed = 20, active = true) => {
    const [displayedText, setDisplayedText] = useState('');
    const [isComplete, setIsComplete] = useState(false);

    useEffect(() => {
        if (!active || !text) {
            setDisplayedText(text || '');
            setIsComplete(true);
            return;
        }

        setDisplayedText('');
        setIsComplete(false);

        let index = 0;
        const words = text.split(' ');

        const timer = setInterval(() => {
            if (index < words.length) {
                setDisplayedText((prev) => prev + (index === 0 ? '' : ' ') + words[index]);
                index++;
            } else {
                clearInterval(timer);
                setIsComplete(true);
            }
        }, speed);

        return () => clearInterval(timer);
    }, [text, speed, active]);

    return { displayedText, isComplete };
};

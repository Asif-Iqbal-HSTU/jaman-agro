import { useEffect, useRef, useState } from 'react';

/**
 * Track an element's width so charts can draw at real pixel sizes
 * (text never stretches the way a scaled viewBox would).
 */
export function useWidth<T extends HTMLElement>() {
    const ref = useRef<T>(null);
    const [width, setWidth] = useState(0);

    useEffect(() => {
        const el = ref.current;

        if (!el) {
            return;
        }

        const observer = new ResizeObserver(([entry]) =>
            setWidth(Math.floor(entry.contentRect.width)),
        );
        observer.observe(el);

        return () => observer.disconnect();
    }, []);

    return { ref, width };
}

/**
 * Round tick values: 0 and up to ~4 clean steps covering the max.
 */
export function niceTicks(max: number, count = 4): number[] {
    if (max <= 0) {
        return [0, 1];
    }

    const raw = max / count;
    const magnitude = 10 ** Math.floor(Math.log10(raw));
    const step =
        [1, 2, 2.5, 5, 10].map((m) => m * magnitude).find((s) => s >= raw) ??
        raw;
    const top = Math.ceil(max / step) * step;

    return Array.from({ length: Math.round(top / step) + 1 }, (_, i) =>
        Number((i * step).toFixed(6)),
    );
}

/**
 * A bar/column path with a 4px rounded data end and a square baseline end.
 */
export function columnPath(
    x: number,
    y: number,
    width: number,
    height: number,
): string {
    if (height <= 0) {
        return '';
    }

    const r = Math.min(4, width / 2, height);

    return [
        `M${x},${y + height}`,
        `V${y + r}`,
        `Q${x},${y} ${x + r},${y}`,
        `H${x + width - r}`,
        `Q${x + width},${y} ${x + width},${y + r}`,
        `V${y + height}`,
        'Z',
    ].join(' ');
}

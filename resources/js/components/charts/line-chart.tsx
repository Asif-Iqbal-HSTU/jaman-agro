import { useState } from 'react';
import { niceTicks, useWidth } from './chart-utils';

type Props = {
    categories: string[];
    /** null leaves a gap (no data that month). */
    values: (number | null)[];
    color: string;
    name: string;
    formatValue: (n: number) => string;
    formatTick: (n: number) => string;
    height?: number;
    ariaLabel: string;
};

const MARGIN = { top: 16, right: 16, bottom: 28, left: 52 };

/**
 * One series over time, with a crosshair and tooltip on hover.
 */
export function LineChart({
    categories,
    values,
    color,
    name,
    formatValue,
    formatTick,
    height = 200,
    ariaLabel,
}: Props) {
    const { ref, width } = useWidth<HTMLDivElement>();
    const [hover, setHover] = useState<number | null>(null);

    const present = values.filter((v): v is number => v !== null);
    const ticks = niceTicks(Math.max(0, ...present));
    const top = ticks[ticks.length - 1];

    const plotW = Math.max(0, width - MARGIN.left - MARGIN.right);
    const plotH = height - MARGIN.top - MARGIN.bottom;
    const band = categories.length ? plotW / categories.length : 0;
    const x = (i: number) => MARGIN.left + band * i + band / 2;
    const y = (v: number) => MARGIN.top + plotH - (v / top) * plotH;

    // Split into runs so a month without data breaks the line.
    const runs: { i: number; v: number }[][] = [];
    values.forEach((v, i) => {
        if (v === null) {
            runs.push([]);
        } else {
            if (runs.length === 0) {
                runs.push([]);
            }
            runs[runs.length - 1].push({ i, v });
        }
    });

    return (
        <div ref={ref} className="relative w-full">
            {width > 0 && (
                <svg
                    width={width}
                    height={height}
                    role="img"
                    aria-label={ariaLabel}
                    onMouseLeave={() => setHover(null)}
                >
                    {ticks.map((t) => (
                        <g key={t}>
                            <line
                                x1={MARGIN.left}
                                x2={width - MARGIN.right}
                                y1={y(t)}
                                y2={y(t)}
                                className="stroke-border"
                                strokeWidth={1}
                            />
                            <text
                                x={MARGIN.left - 8}
                                y={y(t)}
                                dy="0.32em"
                                textAnchor="end"
                                className="fill-muted-foreground text-[11px] tabular-nums"
                            >
                                {formatTick(t)}
                            </text>
                        </g>
                    ))}

                    {hover !== null && (
                        <line
                            x1={x(hover)}
                            x2={x(hover)}
                            y1={MARGIN.top}
                            y2={MARGIN.top + plotH}
                            className="stroke-muted-foreground"
                            strokeWidth={1}
                            opacity={0.5}
                        />
                    )}

                    {runs
                        .filter((run) => run.length > 0)
                        .map((run) => (
                            <polyline
                                key={run[0].i}
                                points={run
                                    .map((p) => `${x(p.i)},${y(p.v)}`)
                                    .join(' ')}
                                fill="none"
                                stroke={color}
                                strokeWidth={2}
                                strokeLinejoin="round"
                                strokeLinecap="round"
                            />
                        ))}

                    {values.map((v, i) =>
                        v === null ? null : (
                            <circle
                                key={i}
                                cx={x(i)}
                                cy={y(v)}
                                r={hover === i ? 5 : 4}
                                fill={color}
                                className="stroke-background"
                                strokeWidth={2}
                            />
                        ),
                    )}

                    {categories.map((label, i) => (
                        <g key={label}>
                            <text
                                x={x(i)}
                                y={height - 8}
                                textAnchor="middle"
                                className="fill-muted-foreground text-[11px]"
                            >
                                {label}
                            </text>
                            <rect
                                x={MARGIN.left + band * i}
                                y={MARGIN.top}
                                width={band}
                                height={plotH}
                                fill="transparent"
                                tabIndex={0}
                                onMouseEnter={() => setHover(i)}
                                onFocus={() => setHover(i)}
                                aria-label={`${label}: ${values[i] === null ? '—' : formatValue(values[i])}`}
                            />
                        </g>
                    ))}
                </svg>
            )}

            {hover !== null && width > 0 && (
                <div
                    className="pointer-events-none absolute top-0 z-10 rounded-lg border bg-popover px-3 py-2 text-xs shadow-md"
                    style={{ left: Math.min(x(hover) + 8, width - 140) }}
                >
                    <p className="mb-0.5 font-medium">{categories[hover]}</p>
                    <p className="flex items-center gap-3">
                        <span className="flex items-center gap-1.5 text-muted-foreground">
                            <span
                                className="inline-block h-0.5 w-3 rounded"
                                style={{ background: color }}
                            />
                            {name}
                        </span>
                        <span className="font-medium tabular-nums">
                            {values[hover] === null
                                ? '—'
                                : formatValue(values[hover])}
                        </span>
                    </p>
                </div>
            )}
        </div>
    );
}

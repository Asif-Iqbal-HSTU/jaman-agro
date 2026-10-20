import { useState } from 'react';
import { columnPath, niceTicks, useWidth } from './chart-utils';

export type Series = {
    key: string;
    name: string;
    /** A CSS colour, normally one of the --series-N tokens. */
    color: string;
};

type Props = {
    categories: string[];
    series: Series[];
    /** values[categoryIndex][seriesIndex] */
    values: number[][];
    formatValue: (n: number) => string;
    formatTick: (n: number) => string;
    height?: number;
    ariaLabel: string;
};

const MARGIN = { top: 12, right: 8, bottom: 28, left: 52 };
const BAR_MAX = 24;
const GAP = 2;

/**
 * Columns per category, side by side when there is more than one series.
 * Hovering a category shows every series value for it.
 */
export function ColumnChart({
    categories,
    series,
    values,
    formatValue,
    formatTick,
    height = 240,
    ariaLabel,
}: Props) {
    const { ref, width } = useWidth<HTMLDivElement>();
    const [hover, setHover] = useState<number | null>(null);

    const max = Math.max(0, ...values.flat());
    const ticks = niceTicks(max);
    const top = ticks[ticks.length - 1];

    const plotW = Math.max(0, width - MARGIN.left - MARGIN.right);
    const plotH = height - MARGIN.top - MARGIN.bottom;
    const band = categories.length ? plotW / categories.length : 0;
    const barW = Math.max(
        2,
        Math.min(
            BAR_MAX,
            (band * 0.7 - GAP * (series.length - 1)) / series.length,
        ),
    );
    const groupW = barW * series.length + GAP * (series.length - 1);
    const y = (v: number) => MARGIN.top + plotH - (v / top) * plotH;

    return (
        <div ref={ref} className="relative w-full">
            {series.length > 1 && (
                <ul className="mb-3 flex flex-wrap gap-4 text-xs text-muted-foreground">
                    {series.map((s) => (
                        <li key={s.key} className="flex items-center gap-1.5">
                            <span
                                className="inline-block size-2.5 rounded-sm"
                                style={{ background: s.color }}
                            />
                            {s.name}
                        </li>
                    ))}
                </ul>
            )}

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

                    {categories.map((label, i) => {
                        const x0 = MARGIN.left + band * i + (band - groupW) / 2;

                        return (
                            <g key={label}>
                                {hover === i && (
                                    <rect
                                        x={MARGIN.left + band * i}
                                        y={MARGIN.top}
                                        width={band}
                                        height={plotH}
                                        className="fill-muted"
                                        opacity={0.6}
                                    />
                                )}
                                {series.map((s, j) => {
                                    const v = values[i]?.[j] ?? 0;

                                    return (
                                        <path
                                            key={s.key}
                                            d={columnPath(
                                                x0 + j * (barW + GAP),
                                                y(v),
                                                barW,
                                                y(0) - y(v),
                                            )}
                                            fill={s.color}
                                        />
                                    );
                                })}
                                <text
                                    x={MARGIN.left + band * i + band / 2}
                                    y={height - 8}
                                    textAnchor="middle"
                                    className="fill-muted-foreground text-[11px]"
                                >
                                    {label}
                                </text>
                                {/* Hit target: the whole band, larger than the marks. */}
                                <rect
                                    x={MARGIN.left + band * i}
                                    y={MARGIN.top}
                                    width={band}
                                    height={plotH}
                                    fill="transparent"
                                    onMouseEnter={() => setHover(i)}
                                    onFocus={() => setHover(i)}
                                    tabIndex={0}
                                    aria-label={`${label}: ${series
                                        .map(
                                            (s, j) =>
                                                `${s.name} ${formatValue(values[i]?.[j] ?? 0)}`,
                                        )
                                        .join(', ')}`}
                                />
                            </g>
                        );
                    })}
                </svg>
            )}

            {hover !== null && width > 0 && (
                <div
                    className="pointer-events-none absolute z-10 min-w-36 rounded-lg border bg-popover px-3 py-2 text-xs shadow-md"
                    style={{
                        left: Math.min(
                            MARGIN.left + band * hover + band / 2 + 8,
                            width - 160,
                        ),
                        top: series.length > 1 ? 32 : 0,
                    }}
                >
                    <p className="mb-1 font-medium">{categories[hover]}</p>
                    {series.map((s, j) => (
                        <p
                            key={s.key}
                            className="flex items-center justify-between gap-3"
                        >
                            <span className="flex items-center gap-1.5 text-muted-foreground">
                                <span
                                    className="inline-block size-2 rounded-sm"
                                    style={{ background: s.color }}
                                />
                                {s.name}
                            </span>
                            <span className="font-medium tabular-nums">
                                {formatValue(values[hover]?.[j] ?? 0)}
                            </span>
                        </p>
                    ))}
                </div>
            )}
        </div>
    );
}

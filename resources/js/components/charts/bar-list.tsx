type Props = {
    rows: { label: string; value: number }[];
    color: string;
    formatValue: (n: number) => string;
    ariaLabel: string;
};

/**
 * Horizontal bars, one per row, with the value at the tip. Built as a grid
 * so the label column sizes itself to the longest label and never clips.
 */
export function BarList({ rows, color, formatValue, ariaLabel }: Props) {
    const max = Math.max(0, ...rows.map((r) => r.value));

    return (
        <ul
            aria-label={ariaLabel}
            className="grid grid-cols-[auto_1fr] items-center gap-x-3 gap-y-2"
        >
            {rows.map((r) => (
                <li
                    key={r.label}
                    className="contents"
                    title={`${r.label}: ${formatValue(r.value)}`}
                >
                    <span className="max-w-40 text-xs font-medium">
                        {r.label}
                    </span>
                    <span className="flex min-w-0 items-center gap-2">
                        <span
                            className="h-4 shrink-0 rounded-r-[4px]"
                            style={{
                                width: `calc((100% - 7rem) * ${max > 0 ? r.value / max : 0})`,
                                background: color,
                            }}
                        />
                        <span className="text-xs whitespace-nowrap text-muted-foreground tabular-nums">
                            {formatValue(r.value)}
                        </span>
                    </span>
                </li>
            ))}
        </ul>
    );
}

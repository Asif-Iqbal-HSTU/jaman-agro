import { Head, Link, usePage } from '@inertiajs/react';
import {
    ArrowRight,
    BarChart3,
    Boxes,
    CalendarCheck,
    Factory,
    Gavel,
    Leaf,
    Menu,
    Scale,
    ShieldCheck,
    Sprout,
    Truck,
    Users,
    Wallet,
    X,
} from 'lucide-react';
import { useState } from 'react';
import { dashboard, login } from '@/routes';

const modules = [
    {
        icon: Scale,
        title: 'Green leaf intake',
        body: 'Weigh every delivery at the gate, record supplier, garden and moisture deduction, and print a slip on the spot.',
    },
    {
        icon: Sprout,
        title: 'Gardens & sections',
        body: 'Map estates, sections and plucking rounds. See yield per hectare and plan the next round before the flush peaks.',
    },
    {
        icon: Users,
        title: 'Workforce & attendance',
        body: 'Daily muster, plucking kilos per worker, piece-rate wages and rations, all reconciled at the end of the week.',
    },
    {
        icon: Factory,
        title: 'Production batches',
        body: 'Follow each batch through withering, rolling, fermentation and drying with times, temperatures and out-turn.',
    },
    {
        icon: Boxes,
        title: 'Grading & stock',
        body: 'Sort made tea into grades like BOP, PF, Dust and FBOP, pack into chests and track every kilo in the warehouse.',
    },
    {
        icon: Gavel,
        title: 'Auction & sales',
        body: 'Prepare broker catalogues, record lot prices from the auction floor and follow dispatch until payment arrives.',
    },
    {
        icon: Wallet,
        title: 'Accounts & payments',
        body: 'Supplier leaf bills, worker payroll and factory expenses in one ledger, ready for month-end without the spreadsheets.',
    },
    {
        icon: BarChart3,
        title: 'Reports',
        body: 'Made-tea recovery, cost per kilo and grade mix, by day, week or season, ready for the management meeting.',
    },
];

const stages = [
    { name: 'Plucking', note: 'Two leaves and a bud' },
    { name: 'Withering', note: 'Moisture comes down' },
    { name: 'Rolling', note: 'CTC or orthodox' },
    { name: 'Fermentation', note: 'Colour and briskness' },
    { name: 'Drying', note: 'Fired and stabilised' },
    { name: 'Sorting', note: 'Graded and packed' },
    { name: 'Auction', note: 'Lots sold and shipped' },
];

const roles = [
    {
        icon: ShieldCheck,
        title: 'Management',
        body: 'Live recovery, costs and stock at a glance, without waiting for the evening phone call.',
    },
    {
        icon: CalendarCheck,
        title: 'Garden managers',
        body: 'Muster, plucking rounds and section output entered on site, straight from a phone.',
    },
    {
        icon: Factory,
        title: 'Factory floor',
        body: 'Batch logs and machine readings that follow the leaf, shift after shift.',
    },
    {
        icon: Truck,
        title: 'Sales & accounts',
        body: 'Catalogues, invoices and payments matched to the chests that actually left the gate.',
    },
];

function HillsArt() {
    return (
        <svg
            viewBox="0 0 800 520"
            className="h-full w-full"
            preserveAspectRatio="xMidYMax slice"
            aria-hidden="true"
        >
            <defs>
                <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0" stopColor="#f4e6c8" />
                    <stop offset="1" stopColor="#e9dcbf" />
                </linearGradient>
                <pattern
                    id="rows"
                    width="28"
                    height="14"
                    patternUnits="userSpaceOnUse"
                    patternTransform="rotate(-8)"
                >
                    <path
                        d="M0 7 q7 -6 14 0 t14 0"
                        fill="none"
                        stroke="#ffffff"
                        strokeOpacity="0.16"
                        strokeWidth="3"
                    />
                </pattern>
            </defs>
            <rect width="800" height="520" fill="url(#sky)" />
            <circle cx="590" cy="150" r="70" fill="#e7a548" opacity="0.85" />
            <path
                d="M0 250 C150 190 260 220 380 200 C520 175 640 230 800 190 L800 520 L0 520Z"
                fill="#9db58a"
            />
            <path
                d="M0 310 C120 260 250 300 400 270 C540 245 660 300 800 265 L800 520 L0 520Z"
                fill="#5f8a55"
            />
            <path
                d="M0 310 C120 260 250 300 400 270 C540 245 660 300 800 265 L800 520 L0 520Z"
                fill="url(#rows)"
            />
            <path
                d="M0 390 C160 340 300 390 450 355 C590 325 700 370 800 345 L800 520 L0 520Z"
                fill="#2f5a36"
            />
            <path
                d="M0 390 C160 340 300 390 450 355 C590 325 700 370 800 345 L800 520 L0 520Z"
                fill="url(#rows)"
            />
            <path
                d="M0 460 C180 420 330 470 500 440 C640 418 720 445 800 430 L800 520 L0 520Z"
                fill="#1b3a24"
            />
            <g fill="#1b3a24">
                <rect x="96" y="232" width="4" height="22" />
                <circle cx="98" cy="226" r="12" />
                <rect x="690" y="216" width="4" height="24" />
                <circle cx="692" cy="210" r="14" />
            </g>
        </svg>
    );
}

function DashboardPreview() {
    const bars = [62, 78, 54, 88, 70, 94, 81];

    return (
        <div className="w-full max-w-sm rounded-2xl border border-white/60 bg-white/90 p-5 shadow-2xl shadow-black/20 backdrop-blur dark:border-white/10 dark:bg-[#132017]/90">
            <div className="flex items-center justify-between">
                <p className="text-xs font-medium tracking-wide text-[#5b6b5e] uppercase dark:text-[#a8b8a6]">
                    Today's leaf intake
                </p>
                <span className="rounded-full bg-[#e3efdc] px-2 py-0.5 text-[11px] font-medium text-[#2f5a36] dark:bg-[#24402a] dark:text-[#b9d8ae]">
                    Live
                </span>
            </div>
            <p className="mt-2 font-serif text-3xl font-semibold text-[#1b2a1f] dark:text-[#eef3ea]">
                18,420 <span className="text-base font-normal">kg</span>
            </p>
            <div className="mt-4 flex h-20 items-end gap-2">
                {bars.map((h, i) => (
                    <div
                        key={i}
                        className="flex-1 rounded-t bg-[#5f8a55] dark:bg-[#7fae72]"
                        style={{ height: `${h}%`, opacity: 0.55 + i * 0.06 }}
                    />
                ))}
            </div>
            <div className="mt-4 grid grid-cols-3 gap-3 border-t border-[#e6e1d4] pt-4 text-xs dark:border-white/10">
                <div>
                    <p className="text-[#5b6b5e] dark:text-[#a8b8a6]">
                        Recovery
                    </p>
                    <p className="mt-0.5 font-semibold text-[#1b2a1f] dark:text-[#eef3ea]">
                        22.4%
                    </p>
                </div>
                <div>
                    <p className="text-[#5b6b5e] dark:text-[#a8b8a6]">
                        Batches
                    </p>
                    <p className="mt-0.5 font-semibold text-[#1b2a1f] dark:text-[#eef3ea]">
                        14
                    </p>
                </div>
                <div>
                    <p className="text-[#5b6b5e] dark:text-[#a8b8a6]">
                        Suppliers
                    </p>
                    <p className="mt-0.5 font-semibold text-[#1b2a1f] dark:text-[#eef3ea]">
                        63
                    </p>
                </div>
            </div>
            <p className="mt-3 text-[10px] text-[#8a9589] dark:text-[#7d8c7c]">
                Sample figures for preview
            </p>
        </div>
    );
}

export default function Welcome() {
    const { auth } = usePage().props;
    const [menuOpen, setMenuOpen] = useState(false);

    const navLinks = [
        { href: '#modules', label: 'Modules' },
        { href: '#process', label: 'Process' },
        { href: '#teams', label: 'Teams' },
    ];

    const primaryCta = auth.user ? (
        <Link
            href={dashboard()}
            className="inline-flex items-center gap-2 rounded-full bg-[#1f4a2b] px-6 py-3 text-sm font-medium text-white transition hover:bg-[#173a21] dark:bg-[#b9d8ae] dark:text-[#10200f] dark:hover:bg-[#cfe6c6]"
        >
            Go to dashboard <ArrowRight className="size-4" />
        </Link>
    ) : (
        <Link
            href={login()}
            className="inline-flex items-center gap-2 rounded-full bg-[#1f4a2b] px-6 py-3 text-sm font-medium text-white transition hover:bg-[#173a21] dark:bg-[#b9d8ae] dark:text-[#10200f] dark:hover:bg-[#cfe6c6]"
        >
            Sign in to the portal <ArrowRight className="size-4" />
        </Link>
    );

    return (
        <>
            <Head title="Tea Factory Management" />
            <div className="min-h-screen bg-[#faf7f0] text-[#1b2a1f] dark:bg-[#0d1510] dark:text-[#e6ece3]">
                {/* Navigation */}
                <header className="sticky top-0 z-30 border-b border-[#e6e1d4]/80 bg-[#faf7f0]/85 backdrop-blur dark:border-white/10 dark:bg-[#0d1510]/85">
                    <nav className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 sm:px-6">
                        <a href="#" className="flex items-center gap-2.5">
                            <span className="flex size-9 items-center justify-center rounded-full bg-[#1f4a2b] text-[#e8d7a6] dark:bg-[#b9d8ae] dark:text-[#10200f]">
                                <Leaf className="size-5" />
                            </span>
                            <span className="leading-tight">
                                <span className="block font-serif text-lg font-semibold">
                                    Jaman Agro
                                </span>
                                <span className="block text-[11px] tracking-[0.18em] text-[#6b776c] uppercase dark:text-[#9aab98]">
                                    Tea Factory
                                </span>
                            </span>
                        </a>

                        <div className="hidden items-center gap-8 text-sm md:flex">
                            {navLinks.map((l) => (
                                <a
                                    key={l.href}
                                    href={l.href}
                                    className="text-[#4a574c] transition hover:text-[#1b2a1f] dark:text-[#b4c2b2] dark:hover:text-white"
                                >
                                    {l.label}
                                </a>
                            ))}
                        </div>

                        <div className="hidden items-center gap-3 md:flex">
                            {auth.user ? (
                                <Link
                                    href={dashboard()}
                                    className="rounded-full bg-[#1f4a2b] px-5 py-2 text-sm font-medium text-white hover:bg-[#173a21] dark:bg-[#b9d8ae] dark:text-[#10200f]"
                                >
                                    Dashboard
                                </Link>
                            ) : (
                                <Link
                                    href={login()}
                                    className="rounded-full border border-[#1f4a2b] px-5 py-2 text-sm font-medium text-[#1f4a2b] transition hover:bg-[#1f4a2b] hover:text-white dark:border-[#b9d8ae] dark:text-[#b9d8ae] dark:hover:bg-[#b9d8ae] dark:hover:text-[#10200f]"
                                >
                                    Staff login
                                </Link>
                            )}
                        </div>

                        <button
                            type="button"
                            className="rounded-md p-2 md:hidden"
                            onClick={() => setMenuOpen((o) => !o)}
                            aria-label="Toggle menu"
                            aria-expanded={menuOpen}
                        >
                            {menuOpen ? (
                                <X className="size-5" />
                            ) : (
                                <Menu className="size-5" />
                            )}
                        </button>
                    </nav>

                    {menuOpen && (
                        <div className="border-t border-[#e6e1d4] px-4 pt-2 pb-4 md:hidden dark:border-white/10">
                            {navLinks.map((l) => (
                                <a
                                    key={l.href}
                                    href={l.href}
                                    onClick={() => setMenuOpen(false)}
                                    className="block py-2 text-sm text-[#4a574c] dark:text-[#b4c2b2]"
                                >
                                    {l.label}
                                </a>
                            ))}
                            <div className="mt-3 flex gap-3">
                                {auth.user ? (
                                    <Link
                                        href={dashboard()}
                                        className="flex-1 rounded-full bg-[#1f4a2b] px-4 py-2 text-center text-sm font-medium text-white dark:bg-[#b9d8ae] dark:text-[#10200f]"
                                    >
                                        Dashboard
                                    </Link>
                                ) : (
                                    <Link
                                        href={login()}
                                        className="flex-1 rounded-full bg-[#1f4a2b] px-4 py-2 text-center text-sm font-medium text-white dark:bg-[#b9d8ae] dark:text-[#10200f]"
                                    >
                                        Staff login
                                    </Link>
                                )}
                            </div>
                        </div>
                    )}
                </header>

                <main>
                    {/* Hero */}
                    <section className="mx-auto grid max-w-6xl items-center gap-12 px-4 pt-14 pb-20 sm:px-6 lg:grid-cols-[1.05fr_1fr] lg:pt-20">
                        <div>
                            <p className="inline-flex items-center gap-2 rounded-full bg-[#e8efe0] px-3 py-1 text-xs font-medium text-[#2f5a36] dark:bg-[#1c2e20] dark:text-[#b9d8ae]">
                                <Leaf className="size-3.5" />
                                From garden to auction floor
                            </p>
                            <h1 className="mt-6 font-serif text-4xl leading-[1.08] font-semibold tracking-tight text-balance sm:text-5xl lg:text-6xl">
                                Every leaf, every batch,{' '}
                                <span className="text-[#5f8a55] italic dark:text-[#9cc58f]">
                                    accounted for.
                                </span>
                            </h1>
                            <p className="mt-6 max-w-xl text-lg leading-relaxed text-[#4a574c] dark:text-[#b4c2b2]">
                                The Jaman Agro factory system brings green leaf
                                intake, production, grading, stock, sales and
                                payroll into one place, so the whole estate runs
                                on the same numbers.
                            </p>
                            <div className="mt-8 flex flex-wrap items-center gap-4">
                                {primaryCta}
                                <a
                                    href="#modules"
                                    className="inline-flex items-center gap-2 px-2 py-3 text-sm font-medium text-[#1f4a2b] hover:underline dark:text-[#b9d8ae]"
                                >
                                    See what's inside
                                </a>
                            </div>
                        </div>

                        <div className="relative">
                            <div className="relative aspect-[4/3] overflow-hidden rounded-[2rem] shadow-xl ring-1 shadow-[#1b3a24]/20 ring-black/5">
                                <HillsArt />
                            </div>
                            <div className="relative -mt-24 flex justify-end px-4 sm:-mt-28 sm:px-0 lg:absolute lg:-bottom-10 lg:-left-10 lg:mt-0 lg:justify-start">
                                <DashboardPreview />
                            </div>
                        </div>
                    </section>

                    {/* Highlights strip */}
                    <section className="border-y border-[#e6e1d4] bg-[#f2ede1] dark:border-white/10 dark:bg-[#111c14]">
                        <div className="mx-auto grid max-w-6xl grid-cols-2 gap-8 px-4 py-10 sm:px-6 md:grid-cols-4">
                            {[
                                ['8', 'Connected modules'],
                                ['7', 'Process stages tracked'],
                                ['1', 'Ledger for the estate'],
                                ['24/7', 'Access from any device'],
                            ].map(([value, label]) => (
                                <div key={label}>
                                    <p className="font-serif text-3xl font-semibold text-[#1f4a2b] dark:text-[#b9d8ae]">
                                        {value}
                                    </p>
                                    <p className="mt-1 text-sm text-[#5b6b5e] dark:text-[#a8b8a6]">
                                        {label}
                                    </p>
                                </div>
                            ))}
                        </div>
                    </section>

                    {/* Modules */}
                    <section
                        id="modules"
                        className="mx-auto max-w-6xl scroll-mt-24 px-4 py-20 sm:px-6"
                    >
                        <div className="max-w-2xl">
                            <p className="text-sm font-medium tracking-[0.18em] text-[#b0713a] uppercase dark:text-[#e0a46a]">
                                Modules
                            </p>
                            <h2 className="mt-3 font-serif text-3xl font-semibold tracking-tight sm:text-4xl">
                                Built around how a tea factory actually works
                            </h2>
                            <p className="mt-4 text-[#4a574c] dark:text-[#b4c2b2]">
                                Each part of the operation has its own
                                workspace, and each one feeds the next, so a
                                kilo weighed at the gate shows up all the way
                                through to the sale.
                            </p>
                        </div>

                        <div className="mt-12 grid gap-px overflow-hidden rounded-2xl border border-[#e6e1d4] bg-[#e6e1d4] sm:grid-cols-2 lg:grid-cols-4 dark:border-white/10 dark:bg-white/10">
                            {modules.map(({ icon: Icon, title, body }) => (
                                <div
                                    key={title}
                                    className="group bg-[#faf7f0] p-6 transition hover:bg-white dark:bg-[#0d1510] dark:hover:bg-[#132017]"
                                >
                                    <span className="flex size-10 items-center justify-center rounded-xl bg-[#e8efe0] text-[#2f5a36] transition group-hover:bg-[#1f4a2b] group-hover:text-[#e8d7a6] dark:bg-[#1c2e20] dark:text-[#b9d8ae]">
                                        <Icon className="size-5" />
                                    </span>
                                    <h3 className="mt-5 font-semibold">
                                        {title}
                                    </h3>
                                    <p className="mt-2 text-sm leading-relaxed text-[#5b6b5e] dark:text-[#a8b8a6]">
                                        {body}
                                    </p>
                                </div>
                            ))}
                        </div>
                    </section>

                    {/* Process */}
                    <section
                        id="process"
                        className="scroll-mt-24 bg-[#1b3a24] text-[#eef3ea] dark:bg-[#0a1a0f]"
                    >
                        <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
                            <div className="max-w-2xl">
                                <p className="text-sm font-medium tracking-[0.18em] text-[#e0a46a] uppercase">
                                    The journey of a leaf
                                </p>
                                <h2 className="mt-3 font-serif text-3xl font-semibold tracking-tight sm:text-4xl">
                                    One record, from the bush to the buyer
                                </h2>
                                <p className="mt-4 text-[#c3d3c0]">
                                    Batches carry their history with them. When
                                    a lot sells, you can see which garden it
                                    came from, how long it withered and who
                                    sorted it.
                                </p>
                            </div>

                            <ol className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-7 lg:gap-0">
                                {stages.map((s, i) => (
                                    <li
                                        key={s.name}
                                        className="relative flex gap-4 lg:flex-col lg:gap-0 lg:pr-4"
                                    >
                                        <div className="flex items-center lg:mb-5">
                                            <span className="flex size-10 shrink-0 items-center justify-center rounded-full border border-[#e0a46a]/60 font-serif text-sm font-semibold text-[#e8d7a6]">
                                                {String(i + 1).padStart(2, '0')}
                                            </span>
                                            {i < stages.length - 1 && (
                                                <span className="ml-3 hidden h-px flex-1 bg-gradient-to-r from-[#e0a46a]/60 to-transparent lg:block" />
                                            )}
                                        </div>
                                        <div>
                                            <p className="font-semibold">
                                                {s.name}
                                            </p>
                                            <p className="mt-1 text-sm text-[#a9bda6]">
                                                {s.note}
                                            </p>
                                        </div>
                                    </li>
                                ))}
                            </ol>
                        </div>
                    </section>

                    {/* Teams */}
                    <section
                        id="teams"
                        className="mx-auto max-w-6xl scroll-mt-24 px-4 py-20 sm:px-6"
                    >
                        <div className="grid gap-12 lg:grid-cols-[1fr_1.4fr]">
                            <div>
                                <p className="text-sm font-medium tracking-[0.18em] text-[#b0713a] uppercase dark:text-[#e0a46a]">
                                    For every team
                                </p>
                                <h2 className="mt-3 font-serif text-3xl font-semibold tracking-tight sm:text-4xl">
                                    The right view for each person on the estate
                                </h2>
                                <p className="mt-4 text-[#4a574c] dark:text-[#b4c2b2]">
                                    Role-based access means the garden clerk
                                    sees the muster sheet, the accountant sees
                                    the ledger, and management sees everything.
                                </p>
                            </div>
                            <div className="grid gap-5 sm:grid-cols-2">
                                {roles.map(({ icon: Icon, title, body }) => (
                                    <div
                                        key={title}
                                        className="rounded-2xl border border-[#e6e1d4] bg-white p-6 dark:border-white/10 dark:bg-[#132017]"
                                    >
                                        <Icon className="size-6 text-[#b0713a] dark:text-[#e0a46a]" />
                                        <h3 className="mt-4 font-semibold">
                                            {title}
                                        </h3>
                                        <p className="mt-2 text-sm leading-relaxed text-[#5b6b5e] dark:text-[#a8b8a6]">
                                            {body}
                                        </p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </section>

                    {/* CTA */}
                    <section className="px-4 pb-20 sm:px-6">
                        <div className="relative mx-auto max-w-6xl overflow-hidden rounded-[2rem] bg-[#e9dcbf] px-6 py-14 text-center sm:px-12 dark:bg-[#1c2e20]">
                            <Leaf
                                className="pointer-events-none absolute -top-6 -left-6 size-40 rotate-12 text-[#5f8a55]/15 dark:text-[#9cc58f]/10"
                                aria-hidden="true"
                            />
                            <Leaf
                                className="pointer-events-none absolute -right-8 -bottom-10 size-52 -rotate-45 text-[#5f8a55]/15 dark:text-[#9cc58f]/10"
                                aria-hidden="true"
                            />
                            <h2 className="relative mx-auto max-w-2xl font-serif text-3xl font-semibold tracking-tight text-balance sm:text-4xl">
                                Today's flush is coming in. Let's get it on
                                record.
                            </h2>
                            <p className="relative mx-auto mt-4 max-w-xl text-[#4a574c] dark:text-[#b4c2b2]">
                                Sign in with your Jaman Agro staff account to
                                open your workspace.
                            </p>
                            <div className="relative mt-8 flex justify-center">
                                {primaryCta}
                            </div>
                        </div>
                    </section>
                </main>

                <footer className="border-t border-[#e6e1d4] dark:border-white/10">
                    <div className="mx-auto flex max-w-6xl flex-col items-start justify-between gap-4 px-4 py-8 text-sm text-[#6b776c] sm:flex-row sm:items-center sm:px-6 dark:text-[#9aab98]">
                        <div className="flex items-center gap-2">
                            <Leaf className="size-4 text-[#5f8a55]" />
                            <span className="font-serif font-semibold text-[#1b2a1f] dark:text-[#e6ece3]">
                                Jaman Agro
                            </span>
                            <span>Tea Factory Management</span>
                        </div>
                        <p>
                            © {new Date().getFullYear()} Jaman Agro. All rights
                            reserved.
                        </p>
                    </div>
                </footer>
            </div>
        </>
    );
}

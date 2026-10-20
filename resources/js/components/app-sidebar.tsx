import { Link, usePage } from '@inertiajs/react';
import {
    Banknote,
    BookOpen,
    Boxes,
    CalendarClock,
    ClipboardCheck,
    Clock,
    Coins,
    HardHat,
    LockOpen,
    Ruler,
    ChartColumn,
    Factory,
    Gavel,
    Handshake,
    History,
    LayoutGrid,
    ListTree,
    Receipt,
    Scale,
    ShoppingBag,
    Sprout,
    Store,
    Tags,
    Truck,
    Users,
    Warehouse,
} from 'lucide-react';
import AppLogo from '@/components/app-logo';
import { NavMain } from '@/components/nav-main';
import { NavUser } from '@/components/nav-user';
import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
} from '@/components/ui/sidebar';
import { useCanManage } from '@/hooks/use-can-manage';
import { dashboard, setup } from '@/routes';
import { index as activityLog } from '@/routes/admin/activity-log';
import { index as unlockRequests } from '@/routes/admin/unlock-requests';
import { index as users } from '@/routes/admin/users';
import { index as attendance } from '@/routes/attendance';
import { index as auctionInvoices } from '@/routes/auction-invoices';
import { index as brokers } from '@/routes/brokers';
import { index as cashBook } from '@/routes/cash-book';
import { index as customers } from '@/routes/customers';
import { index as expenseCategories } from '@/routes/expense-categories';
import { index as expenses } from '@/routes/expenses';
import { index as grades } from '@/routes/grades';
import { index as leafReceipts } from '@/routes/leaf-receipts';
import { index as pieceRates } from '@/routes/piece-rates';
import { index as pieceWork } from '@/routes/piece-work';
import { index as production } from '@/routes/production';
import { index as reports } from '@/routes/reports';
import { index as retailSales } from '@/routes/retail-sales';
import { index as stock } from '@/routes/stock';
import { index as supplierPayments } from '@/routes/supplier-payments';
import { index as suppliers } from '@/routes/suppliers';
import { index as vehicles } from '@/routes/vehicles';
import { index as wages } from '@/routes/wages';
import { index as warehouses } from '@/routes/warehouses';
import { index as workers } from '@/routes/workers';
import type { NavItem } from '@/types';

const mainNavItems: NavItem[] = [
    {
        title: 'Dashboard',
        href: dashboard(),
        icon: LayoutGrid,
    },
];

const leafNavItems: NavItem[] = [
    {
        title: 'Leaf intake',
        href: leafReceipts(),
        icon: Scale,
    },
    {
        title: 'Suppliers',
        href: suppliers(),
        icon: Sprout,
    },
    {
        title: 'Supplier payments',
        href: supplierPayments(),
        icon: Banknote,
    },
];

const productionNavItems: NavItem[] = [
    {
        title: 'Production',
        href: production(),
        icon: Factory,
    },
    {
        title: 'Made tea stock',
        href: stock(),
        icon: Boxes,
    },
];

const salesNavItems: NavItem[] = [
    {
        title: 'Auction invoices',
        href: auctionInvoices(),
        icon: Gavel,
    },
    {
        title: 'Retail sales',
        href: retailSales(),
        icon: ShoppingBag,
    },
    {
        title: 'Customers',
        href: customers(),
        icon: Store,
    },
];

const workforceNavItems: NavItem[] = [
    {
        title: 'Workers',
        href: workers(),
        icon: HardHat,
    },
    {
        title: 'Attendance',
        href: attendance(),
        icon: Clock,
    },
    {
        title: 'Contract work',
        href: pieceWork(),
        icon: CalendarClock,
    },
    {
        title: 'Wages',
        href: wages(),
        icon: Coins,
    },
];

const pieceRatesNavItem: NavItem = {
    title: 'Job rates',
    href: pieceRates(),
    icon: Ruler,
};

const vehiclesNavItem: NavItem = {
    title: 'Vehicles',
    href: vehicles(),
    icon: Truck,
};

const warehousesNavItem: NavItem = {
    title: 'Warehouses',
    href: warehouses(),
    icon: Warehouse,
};

const setupNavItem: NavItem = {
    title: 'Go-live checklist',
    href: setup(),
    icon: ClipboardCheck,
};

const accountsNavItems: NavItem[] = [
    {
        title: 'Reports',
        href: reports(),
        icon: ChartColumn,
    },
    {
        title: 'Expenses',
        href: expenses(),
        icon: Receipt,
    },
    {
        title: 'Cash book',
        href: cashBook(),
        icon: BookOpen,
    },
];

const expenseCategoriesNavItem: NavItem = {
    title: 'Expense categories',
    href: expenseCategories(),
    icon: ListTree,
};

const brokersNavItem: NavItem = {
    title: 'Brokers',
    href: brokers(),
    icon: Handshake,
};

const gradesNavItem: NavItem = {
    title: 'Tea grades',
    href: grades(),
    icon: Tags,
};

const adminNavItems: NavItem[] = [
    {
        title: 'Users',
        href: users(),
        icon: Users,
    },
    {
        title: 'Activity log',
        href: activityLog(),
        icon: History,
    },
];

export function AppSidebar() {
    const { auth, pendingUnlocks } = usePage().props;
    const canManage = useCanManage();
    const isAdmin = auth.user.role === 'admin';

    return (
        <Sidebar collapsible="icon" variant="inset">
            <SidebarHeader>
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton size="lg" asChild>
                            <Link href={dashboard()} prefetch>
                                <AppLogo />
                            </Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarHeader>

            <SidebarContent>
                <NavMain
                    items={
                        canManage
                            ? [...mainNavItems, setupNavItem]
                            : mainNavItems
                    }
                    label="Factory"
                />
                <NavMain
                    items={
                        canManage
                            ? [...leafNavItems, vehiclesNavItem]
                            : leafNavItems
                    }
                    label="Green leaf"
                />
                <NavMain
                    items={
                        canManage
                            ? [...productionNavItems, gradesNavItem]
                            : productionNavItems
                    }
                    label="Manufacturing"
                />
                <NavMain
                    items={
                        canManage
                            ? [
                                  ...salesNavItems,
                                  warehousesNavItem,
                                  brokersNavItem,
                              ]
                            : salesNavItems
                    }
                    label="Sales"
                />
                <NavMain
                    items={
                        canManage
                            ? [...workforceNavItems, pieceRatesNavItem]
                            : workforceNavItems
                    }
                    label="Workforce"
                />
                <NavMain
                    items={
                        canManage
                            ? [...accountsNavItems, expenseCategoriesNavItem]
                            : accountsNavItems
                    }
                    label="Accounts"
                />
                {isAdmin && (
                    <NavMain
                        items={[
                            ...adminNavItems,
                            {
                                title: 'Unlock requests',
                                href: unlockRequests(),
                                icon: LockOpen,
                                badge: pendingUnlocks,
                            },
                        ]}
                        label="Administration"
                    />
                )}
            </SidebarContent>

            <SidebarFooter>
                <NavUser />
            </SidebarFooter>
        </Sidebar>
    );
}

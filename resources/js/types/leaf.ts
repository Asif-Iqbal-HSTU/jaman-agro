export type Option = {
    value: string;
    label: string;
};

export type SupplierSummary = {
    id: number;
    code: string | null;
    name: string;
    garden_name?: string | null;
};

export type Supplier = SupplierSummary & {
    phone: string | null;
    garden_name: string | null;
    address: string | null;
    opening_balance: string;
    is_active: boolean;
    notes: string | null;
};

export type EditLockState = 'open' | 'locked' | 'pending' | 'unlocked';

/** Every record the manager enters carries these. */
export type Lockable = {
    edit_lock?: EditLockState;
    edited_at?: string | null;
};

export type LeafReceipt = Lockable & {
    id: number;
    number: string;
    received_on: string;
    supplier_id: number;
    supplier?: SupplierSummary & { phone?: string | null };
    delivery_mode: 'supplier' | 'factory_vehicle';
    vehicle_id: number | null;
    vehicle?: { id: number; name: string } | null;
    deduction_type: 'kg' | 'percent';
    recorder?: { id: number; name: string } | null;
    vehicle_no: string | null;
    gross_kg: string;
    tare_kg: string;
    deduction_percent: string | null;
    deduction_kg: string;
    net_kg: string;
    rate: string | null;
    amount: string | null;
    notes: string | null;
    created_at: string;
};

export type SupplierPayment = Lockable & {
    id: number;
    paid_on: string;
    supplier_id: number;
    supplier?: SupplierSummary;
    type: 'advance' | 'payment';
    method: 'cash' | 'bank' | 'mobile_banking';
    amount: string;
    reference: string | null;
    notes: string | null;
};

export type TeaGrade = {
    id: number;
    code: string;
    name: string | null;
    sort_order?: number;
    is_active?: boolean;
    updated_at?: string;
};

export type ProductionBatch = Lockable & {
    id: number;
    produced_on: string;
    green_leaf_kg: string;
    withering_hours: string | null;
    fermentation_minutes: number | null;
    dryer_temp_c: number | null;
    notes: string | null;
    outputs: Record<string, string>;
    made_tea_kg?: string;
    recovery?: string | null;
};

export type StockMovement = {
    id: number;
    moved_on: string;
    tea_grade_id: number;
    grade?: { id: number; code: string };
    recorder?: { id: number; name: string } | null;
    quantity_kg: string;
    type: 'production' | 'adjustment' | 'auction' | 'retail';
    source_type: string | null;
    source_id: number | null;
    reason: string | null;
};

export type Broker = {
    id: number;
    name: string;
    contact_person: string | null;
    phone: string | null;
    is_active: boolean;
    updated_at?: string;
};

export type InvoiceStatus = 'packed' | 'dispatched' | 'sold' | 'paid';

export type AuctionInvoice = Lockable & {
    id: number;
    invoice_no: string;
    packed_on: string;
    tea_grade_id: number;
    grade?: { id: number; code: string };
    package_type: 'chest' | 'bag';
    packages: number;
    kg_per_package: string;
    net_kg: string;
    broker_id: number | null;
    broker?: { id: number; name: string } | null;
    warehouse_id: number | null;
    warehouse?: { id: number; name: string } | null;
    auction_centre: string | null;
    sale_no: string | null;
    lot_no: string | null;
    dispatched_on: string | null;
    sold_on: string | null;
    buyer: string | null;
    price_per_kg: string | null;
    gross_amount: string | null;
    deductions: string;
    net_amount: string | null;
    paid_on: string | null;
    payment_reference: string | null;
    notes: string | null;
    status: InvoiceStatus;
};

export type Customer = {
    id: number;
    name: string;
    phone: string | null;
    address: string | null;
    opening_balance: string;
    is_active: boolean;
    notes: string | null;
};

export type RetailSaleItem = {
    id: number;
    tea_grade_id: number;
    grade?: { id: number; code: string; name?: string | null };
    kg: string;
    rate: string;
    amount: string;
};

export type RetailSale = Lockable & {
    id: number;
    number: string;
    sold_on: string;
    customer_id: number | null;
    customer?: {
        id: number;
        name: string;
        phone?: string | null;
        address?: string | null;
    } | null;
    total_amount: string;
    notes: string | null;
    items: RetailSaleItem[];
    payment?: {
        id: number;
        amount: string;
        method?: string;
        reference?: string | null;
    } | null;
    recorder?: { id: number; name: string } | null;
};

export type Vehicle = {
    id: number;
    name: string;
    registration_no: string | null;
    driver_name?: string | null;
    driver_phone?: string | null;
    is_active?: boolean;
    updated_at?: string;
};

export type Warehouse = {
    id: number;
    name: string;
    location: string | null;
    is_active?: boolean;
    updated_at?: string;
};

export type Worker = {
    id: number;
    name: string;
    phone: string | null;
    pay_type: 'hourly' | 'contract';
    hourly_rate: string | null;
    is_active: boolean;
    notes: string | null;
};

export type PieceRate = {
    id: number;
    name: string;
    unit: 'kg' | 'bag' | 'ton' | 'job';
    rate: string;
    sort_order?: number;
    is_active?: boolean;
    updated_at?: string;
};

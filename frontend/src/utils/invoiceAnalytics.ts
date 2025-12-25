import { TemplateData, AppMappingItem } from '../types/template';

export interface CustomerStats {
    name: string;
    email: string;
    phone: string;
    totalSpent: number;
    invoiceCount: number;
    lastPurchase: string;
}

export interface InvoiceAnalytics {
    totalRevenue: number;
    totalInvoices: number;
    averageInvoiceValue: number;
    revenueByMonth: { [key: string]: number };
    gstByMonth: { [key: string]: number };
    topItems: { name: string; count: number; revenue: number }[];
    recentActivity: { date: string; amount: number; fileName: string }[];
    customers: CustomerStats[];
}

export const parseInvoiceData = (files: any[]): InvoiceAnalytics => {
    const analytics: InvoiceAnalytics = {
        totalRevenue: 0,
        totalInvoices: 0,
        averageInvoiceValue: 0,
        revenueByMonth: {},
        gstByMonth: {},
        topItems: [],
        recentActivity: [],
        customers: []
    };

    const itemMap = new Map<string, { count: number; revenue: number }>();
    const customerMap = new Map<string, CustomerStats>();

    files.forEach(file => {
        try {
            // Skip if no content or templateId
            if (!file.content || !file.templateId) return;

            // Removed DATA dependency. Analytics relying on static mapping will be limited.
            const template: TemplateData | null = null;



            // Decode content
            let mscContent;
            try {
                mscContent = JSON.parse(decodeURIComponent(file.content));
            } catch (e) {
                console.error("Error parsing file content", file.name, e);
                return;
            }

            // Get the save string (assuming single sheet or first sheet)
            const sheetName = mscContent.currentid || 'sheet1';
            const sheetData = mscContent.sheetArr?.[sheetName];
            if (!sheetData?.sheetstr?.savestr) return;

            const saveStr = sheetData.sheetstr.savestr;
            const lines = saveStr.split('\n');
            const cellValues = new Map<string, string>();

            // Parse cells
            lines.forEach(line => {
                if (line.startsWith('cell:')) {
                    const parts = line.split(':');
                    // Format: cell:Coord:type:value...
                    const coord = parts[1];

                    // Find value
                    let value = '';
                    for (let i = 2; i < parts.length; i++) {
                        if (parts[i] === 'v') {
                            value = parts[i + 1];
                            break;
                        } else if (parts[i] === 't') {
                            value = parts[i + 1];
                            break;
                        }
                    }

                    if (value) {
                        cellValues.set(coord, value);
                    }
                }
            });

            // Extract Customer Info from appMapping
            let customerName = '';
            let customerEmail = '';
            let customerPhone = '';

            const sheetMapping = template.appMapping?.[sheetName] || template.appMapping?.['sheet1'];

            if (sheetMapping && sheetMapping.BillTo && sheetMapping.BillTo.type === 'form' && sheetMapping.BillTo.formContent) {
                const billToContent = sheetMapping.BillTo.formContent;

                // Helper to get cell val
                const getVal = (item: AppMappingItem) => {
                    if (item.type === 'text' && item.cell) {
                        return cellValues.get(item.cell) || '';
                    }
                    return '';
                };

                if (billToContent.Name) customerName = getVal(billToContent.Name);
                if (billToContent.Email) customerEmail = getVal(billToContent.Email);
                if (billToContent.Phone) customerPhone = getVal(billToContent.Phone);
            }

            // Clean up customer info
            customerName = customerName.replace(/^\[|\]$/g, '').trim();
            if (customerName === 'Name') customerName = '';

            // Extract Total
            let totalAmount = 0;
            let totalCell = 'F36'; // Default for 1001

            // Attempt to infer Total cell if defined in mapping? 
            // Currently mapping doesn't have "Total" explicitly in the partial structure I saw, 
            // but we might add it or rely on default.
            // Some templates might have it.

            if (cellValues.has(totalCell)) {
                const val = parseFloat(cellValues.get(totalCell) || '0');
                if (!isNaN(val)) {
                    totalAmount = val;
                }
            }

            // Try explicit Total if marked in appMapping?
            if (totalAmount === 0 && sheetMapping && sheetMapping['Total']) {
                const totalItem = sheetMapping['Total'];
                if (totalItem.type === 'text' && totalItem.cell) {
                    const val = parseFloat(cellValues.get(totalItem.cell) || '0');
                    if (!isNaN(val)) totalAmount = val;
                }
            }


            if (totalAmount > 0) {
                analytics.totalRevenue += totalAmount;
                analytics.totalInvoices++;

                const date = new Date(file.created);
                const monthKey = date.toLocaleString('default', { month: 'short' });
                analytics.revenueByMonth[monthKey] = (analytics.revenueByMonth[monthKey] || 0) + totalAmount;

                const gst = totalAmount * 0.18;
                analytics.gstByMonth[monthKey] = (analytics.gstByMonth[monthKey] || 0) + gst;

                analytics.recentActivity.push({
                    date: file.created,
                    amount: totalAmount,
                    fileName: file.name
                });

                // Process Customer
                if (customerName) {
                    const key = customerEmail || customerPhone || customerName;
                    const existing = customerMap.get(key) || {
                        name: customerName,
                        email: customerEmail,
                        phone: customerPhone,
                        totalSpent: 0,
                        invoiceCount: 0,
                        lastPurchase: file.created
                    };

                    existing.totalSpent += totalAmount;
                    existing.invoiceCount++;
                    if (new Date(file.created) > new Date(existing.lastPurchase)) {
                        existing.lastPurchase = file.created;
                    }

                    customerMap.set(key, existing);
                }
            }

            // Extract Items
            if (sheetMapping && sheetMapping.Items && sheetMapping.Items.type === 'table') {
                const itemsConfig = sheetMapping.Items;
                if (itemsConfig.rows && itemsConfig.col) {
                    const startRow = itemsConfig.rows.start;
                    const endRow = itemsConfig.rows.end;

                    // Need column letters for Description and Amount
                    const descColItem = itemsConfig.col.Description;
                    const amountColItem = itemsConfig.col.Amount;

                    const descCol = descColItem?.cell;
                    const amountCol = amountColItem?.cell;

                    if (descCol && amountCol) {
                        for (let r = startRow; r <= endRow; r++) {
                            const descCell = `${descCol}${r}`;
                            const amountCell = `${amountCol}${r}`;

                            const desc = cellValues.get(descCell);
                            const amount = parseFloat(cellValues.get(amountCell) || '0');

                            if (desc && amount > 0) {
                                const current = itemMap.get(desc) || { count: 0, revenue: 0 };
                                itemMap.set(desc, {
                                    count: current.count + 1,
                                    revenue: current.revenue + amount
                                });
                            }
                        }
                    }
                }
            }

        } catch (e) {
            console.error("Error processing file for analytics", file.name, e);
        }
    });

    // Finalize
    analytics.averageInvoiceValue = analytics.totalInvoices > 0
        ? analytics.totalRevenue / analytics.totalInvoices
        : 0;

    analytics.topItems = Array.from(itemMap.entries())
        .map(([name, data]) => ({ name, ...data }))
        .sort((a, b) => b.revenue - a.revenue)
        .slice(0, 5);

    analytics.customers = Array.from(customerMap.values())
        .sort((a, b) => b.totalSpent - a.totalSpent);

    analytics.recentActivity.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    analytics.recentActivity = analytics.recentActivity.slice(0, 10);

    return analytics;
};

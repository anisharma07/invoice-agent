import { DATA } from '../templates';

export interface InvoiceAnalytics {
    totalRevenue: number;
    totalInvoices: number;
    averageInvoiceValue: number;
    revenueByMonth: { [key: string]: number };
    topItems: { name: string; count: number; revenue: number }[];
    recentActivity: { date: string; amount: number; fileName: string }[];
}

export const parseInvoiceData = (files: any[]): InvoiceAnalytics => {
    const analytics: InvoiceAnalytics = {
        totalRevenue: 0,
        totalInvoices: 0,
        averageInvoiceValue: 0,
        revenueByMonth: {},
        topItems: [],
        recentActivity: []
    };

    const itemMap = new Map<string, { count: number; revenue: number }>();

    files.forEach(file => {
        try {
            // Skip if no content or templateId
            if (!file.content || !file.templateId) return;

            const template = DATA[file.templateId];
            if (!template) return;

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
                    // Example: cell:F36:v:1234.56...
                    const coord = parts[1];

                    // Find value
                    let value = '';
                    for (let i = 2; i < parts.length; i++) {
                        if (parts[i] === 'v') {
                            value = parts[i + 1];
                            break;
                        } else if (parts[i] === 't') {
                            // Text value, might be escaped
                            value = parts[i + 1];
                            // Simple unescape for now if needed, but usually raw text
                            break;
                        }
                    }

                    if (value) {
                        cellValues.set(coord, value);
                    }
                }
            });

            // Extract Total
            // We need to find the Total cell. 
            // In DATA[1001], it's F36. But it might vary.
            // We can try to look for "TOTAL" label and take the cell next to it, 
            // or rely on hardcoded known locations for specific templates.
            // For now, let's try to find a cell with "TOTAL" and look around it, 
            // or use the template definition if we can infer it.

            // Hardcoded for now based on 1001
            let totalAmount = 0;
            let totalCell = 'F36'; // Default for 1001

            // Try to find "Total" label to be more dynamic
            // This is a heuristic
            /*
            for (const [coord, val] of cellValues.entries()) {
                if (val && typeof val === 'string' && val.toUpperCase().includes('TOTAL')) {
                    // Found label, look for value in same row, next columns
                    // This is complex to implement reliably without grid logic.
                }
            }
            */

            if (cellValues.has(totalCell)) {
                const val = parseFloat(cellValues.get(totalCell) || '0');
                if (!isNaN(val)) {
                    totalAmount = val;
                }
            }

            // If total is 0, maybe it's a different template or not calculated.
            // Let's try to sum up items if total is missing? No, that's risky.

            if (totalAmount > 0) {
                analytics.totalRevenue += totalAmount;
                analytics.totalInvoices++;

                const date = new Date(file.created);
                const monthKey = date.toLocaleString('default', { month: 'short' }); // e.g., "Dec"
                analytics.revenueByMonth[monthKey] = (analytics.revenueByMonth[monthKey] || 0) + totalAmount;

                analytics.recentActivity.push({
                    date: file.created,
                    amount: totalAmount,
                    fileName: file.name
                });
            }

            // Extract Items
            const itemsConfig = template.cellMappings?.sheet1?.Items as any;
            if (itemsConfig && itemsConfig.Rows && itemsConfig.Columns) {
                const startRow = itemsConfig.Rows.start;
                const endRow = itemsConfig.Rows.end;
                const descCol = itemsConfig.Columns.Description;
                const amountCol = itemsConfig.Columns.Amount;

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

    // Sort recent activity
    analytics.recentActivity.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    analytics.recentActivity = analytics.recentActivity.slice(0, 10);

    return analytics;
};

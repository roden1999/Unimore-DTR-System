export const PRODUCT_CATEGORIES = ['Roofing', 'Double Furring', 'Web Deck', 'Insulation', 'C-Purlins', 'Accessories', 'Other'];
export const PRICING_UNITS = ['piece', 'foot', 'linear meter', 'kilogram', 'roll', 'square meter', 'box', 'bundle'];
export const TAX_MODES = ['VAT Exclusive', 'VAT Inclusive', 'Non-VAT'];
export const FULFILLMENT_TYPES = ['Customer Pickup', 'Company Delivery'];
export const INQUIRY_STATUSES = ['Open', 'On Hold', 'Closed', 'Cancelled'];
export const money = (value, symbol = '₱') => `${symbol}${Number(value || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
export const lineTotal = item => Number(item.Quantity || 0) * Number(item.UnitPrice || 0) * (1 - Number(item.DiscountPercent || 0) / 100);
export const documentTotals = form => {
    const subTotal = (form.Items || []).reduce((sum, item) => sum + lineTotal(item), 0);
    const discount = Number(form.DiscountAmount || 0), taxable = Math.max(0, subTotal - discount), rate = Number(form.TaxRate || 0);
    const tax = form.TaxMode === 'VAT Exclusive' ? taxable * rate / 100 : form.TaxMode === 'VAT Inclusive' && rate ? taxable * rate / (100 + rate) : 0;
    return { subTotal, tax, grandTotal: form.TaxMode === 'VAT Exclusive' ? taxable + tax : taxable };
};

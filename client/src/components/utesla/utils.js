export const money = (value, currency = 'PHP') => new Intl.NumberFormat('en-PH', { style: 'currency', currency, minimumFractionDigits: 2 }).format(Number(value || 0));
export const apiMessage = error => error.response?.data?.message || (typeof error.response?.data === 'string' ? error.response.data : 'Unable to process the UTESLA request.');
export const employeeName = row => [row.FirstName, row.MiddleName, row.LastName, row.Suffix].filter(Boolean).join(' ');
export const today = () => new Date().toISOString().slice(0, 10);

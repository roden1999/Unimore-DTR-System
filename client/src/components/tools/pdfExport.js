import pdfMake from 'pdfmake/build/pdfmake.js';
import pdfFonts from 'pdfmake/build/vfs_fonts.js';
import moment from 'moment';

pdfMake.vfs = pdfFonts.pdfMake.vfs;

// Generic table-to-PDF printer. Each column has a header label, a
// value(row) accessor, and an optional width.
const printTablePdf = ({ title, subtitle, columns, rows }) => {
    const body = [
        columns.map((c) => ({ text: c.header, bold: true, fontSize: 9, alignment: 'center', fillColor: '#E5E7EB' })),
    ];
    (rows || []).forEach((r) => {
        body.push(columns.map((c) => ({ text: (c.value(r) ?? '').toString(), fontSize: 8, alignment: c.align || 'left' })));
    });

    const docDefinition = {
        pageOrientation: columns.length > 6 ? 'landscape' : 'portrait',
        pageMargins: [24, 24, 24, 24],
        content: [
            { text: 'Unimore Trading', style: 'brand' },
            {
                columns: [
                    { text: title, style: 'title' },
                    { text: 'Date: ' + moment().format('MMM DD, YYYY'), alignment: 'right', style: 'title' },
                ],
            },
            subtitle ? { text: subtitle, style: 'subtitle', margin: [0, 0, 0, 6] } : {},
            {
                table: { headerRows: 1, widths: columns.map((c) => c.width || '*'), body },
                layout: 'lightHorizontalLines',
            },
        ],
        styles: {
            brand: { fontSize: 16, bold: true, color: '#4F73FF' },
            title: { fontSize: 12, bold: true, margin: [0, 6, 0, 0] },
            subtitle: { fontSize: 10, color: '#555' },
        },
        defaultStyle: { fontSize: 8 },
    };

    pdfMake.createPdf(docDefinition).open();
};

export const exportTools = (rows) => printTablePdf({
    title: 'List of Tools',
    columns: [
        { header: 'Name', value: (r) => r.Name },
        { header: 'Serial No.', value: (r) => r.SerialNo },
        { header: 'Brand', value: (r) => r.Brand || 'No Brand' },
        { header: 'Category', value: (r) => r.Category },
        { header: 'Status', value: (r) => r.Status },
        { header: 'Location', value: (r) => r.Location },
        { header: 'Description', value: (r) => r.Description },
        { header: 'Available', value: (r) => r.Available },
    ],
    rows,
});

export const exportConsumables = (rows) => printTablePdf({
    title: 'List of Consumables',
    columns: [
        { header: 'Name', value: (r) => r.Name },
        { header: 'Brand', value: (r) => r.Brand || 'No Brand' },
        { header: 'Unit', value: (r) => r.Unit },
        { header: 'Received', value: (r) => r.Quantity, align: 'right' },
        { header: 'Used', value: (r) => r.Used, align: 'right' },
        { header: 'Available', value: (r) => Number(r.Quantity) - Number(r.Used), align: 'right' },
        { header: 'Date Purchased', value: (r) => (r.DatePurchased ? moment(r.DatePurchased).format('MM/DD/YYYY') : 'No Date') },
        { header: 'Status', value: (r) => ((Number(r.Quantity) - Number(r.Used)) <= 0 ? 'Out of Stocks' : (r.CritLevelIndicator ? 'Low of Stocks' : 'Good')) },
        { header: 'Description', value: (r) => r.Description },
    ],
    rows,
});

export const exportProjectTools = (project) => printTablePdf({
    title: 'Tool Form',
    subtitle: `Project: ${project.ProjectName}   |   Date: ${moment(project.Date).format('MMM DD, YYYY')}   |   Status: ${project.Status || ''}`,
    columns: [
        { header: 'Tool', value: (r) => r.ToolName },
        { header: 'Serial No.', value: (r) => r.SerialNo },
        { header: 'Borrower', value: (r) => r.EmployeeName },
        { header: 'Date Borrowed', value: (r) => moment(r.DateBorrowed).format('MM/DD/YYYY') },
        { header: 'Returned', value: (r) => (r.Status === 'Returned' ? 'Yes' : 'No') },
        { header: 'Date Returned', value: (r) => (r.DateReturned ? moment(r.DateReturned).format('MM/DD/YYYY') : '') },
        { header: 'Remarks', value: (r) => r.Remarks },
    ],
    rows: project.BorrowedTools || [],
});

export const exportProjectConsumables = (project) => printTablePdf({
    title: 'Consumable Form',
    subtitle: `Project: ${project.ProjectName}   |   Date: ${moment(project.Date).format('MMM DD, YYYY')}   |   Status: ${project.Status || ''}`,
    columns: [
        { header: 'Item', value: (r) => r.Consumable },
        { header: 'Qty', value: (r) => r.Quantity, align: 'right' },
        { header: 'Borrower', value: (r) => r.EmployeeName },
        { header: 'Issued By', value: (r) => r.IssuedBy },
        { header: 'Date Issued', value: (r) => moment(r.DateIssued).format('MM/DD/YYYY') },
        { header: 'Remarks', value: (r) => r.Remarks },
    ],
    rows: project.Data || [],
});

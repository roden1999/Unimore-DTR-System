import React, { useEffect, useMemo, useRef, useState } from 'react';
import axios from 'axios';
import * as XLSX from 'xlsx';
import {
    Button, Card, CardContent, CircularProgress, Dialog, DialogActions,
    DialogContent, DialogTitle, Grid, IconButton, InputAdornment, MenuItem,
    Paper, Snackbar, Table, TableBody, TableCell, TableContainer, TableHead,
    TablePagination, TableRow, TextField, Tooltip, Typography
} from '@material-ui/core';
import Alert from '@material-ui/lab/Alert';
import {
    Add, CloudUpload, Delete, Edit, GetApp, Search, Description
} from '@material-ui/icons';
import { makeStyles } from '@material-ui/core/styles';

const STATUS_VALUES = ['Unprocessed', 'Partial Processed', 'Fully Processed', 'Reject'];
const STATUS_COLORS = {
    Unprocessed: '#9CA3AF',
    'Partial Processed': '#10B981',
    'Fully Processed': '#3B82F6',
    Reject: '#EF4444',
};

const COLUMNS = [
    ['date', 'Date'], ['slitFormNo', 'Slit Form No.'], ['skelpNo', 'Skelp No.'],
    ['hsPrime', 'H / S / Prime'], ['thickness', 'Thickness'], ['width', 'Width'],
    ['weight', 'Weight (kg)'], ['weightMT', 'Weight MT'],
    ['weightBefProc', 'Wt. bef. process (kg)'], ['estLength', 'Est. Length of Skelp (m)'],
    ['estQtyProduce', 'Est. Qty. Produce'], ['fgToProduce', 'FG to Produce'],
    ['lengthOfFg', 'Length of FG'], ['status', 'Status'],
    ['dateProcessed', 'Date Processed'], ['prodFormNo', 'Production Form No.'],
    ['remarks', 'Remarks'], ['operator', 'Operator'], ['location', 'Location'],
    ['otherRemarks', 'Other Remarks'],
];

const TEMPLATE_HEADERS = COLUMNS
    .filter(([key]) => !['weightMT', 'estLength', 'estQtyProduce'].includes(key))
    .map(([, label]) => label);

const DERIVED_FIELDS = new Set(['weightMT', 'estLength', 'estQtyProduce']);
const CELL_NUMERIC_FIELDS = new Set(['thickness', 'width', 'weight', 'weightBefProc', 'lengthOfFg']);

const emptyForm = () => ({
    date: new Date().toISOString().slice(0, 10),
    slitFormNo: '', skelpNo: '', hsPrime: '', thickness: 0, width: 0,
    weight: 0, weightBefProc: 0, fgToProduce: '', lengthOfFg: 0,
    status: 'Unprocessed', dateProcessed: '', prodFormNo: '', remarks: '',
    operator: '', location: '', otherRemarks: '',
});

const useStyles = makeStyles((theme) => ({
    root: { width: '100%', maxWidth: '100%', minWidth: 0 },
    toolbar: {
        display: 'flex', flexWrap: 'wrap', gap: theme.spacing(1),
        alignItems: 'center', marginBottom: theme.spacing(2),
    },
    search: { minWidth: 260, flexGrow: 1, maxWidth: 420 },
    summaryGrid: { marginBottom: theme.spacing(2) },
    summaryCard: { height: '100%', borderLeft: '4px solid' },
    tablePaper: { width: '100%', maxWidth: '100%', minWidth: 0, overflow: 'hidden' },
    tableContainer: {
        display: 'block', width: '100%', maxWidth: '100%',
        maxHeight: 'calc(100vh - 330px)', minHeight: 360,
        overflowX: 'scroll', overflowY: 'auto', scrollbarGutter: 'stable',
    },
    table: { minWidth: 2500 },
    headerCell: {
        background: theme.palette.type === 'dark' ? '#263244' : '#F9FAFB',
        color: theme.palette.text.primary, fontWeight: 700,
        whiteSpace: 'nowrap', position: 'sticky', top: 0, zIndex: 3,
    },
    cell: { whiteSpace: 'nowrap', minWidth: 120 },
    editableCell: {
        cursor: 'cell',
        '&:hover': { backgroundColor: theme.palette.type === 'dark' ? '#22334A' : '#EFF6FF', boxShadow: 'inset 0 0 0 1px #93C5FD' },
    },
    derivedCell: { backgroundColor: theme.palette.type === 'dark' ? '#263244' : '#F9FAFB', color: theme.palette.text.secondary },
    cellInput: { minWidth: 130, '& .MuiOutlinedInput-input': { padding: '7px 9px', fontSize: 13 } },
    groupRow: { background: theme.palette.type === 'dark' ? '#3A3022' : '#FFF7E6' },
    statusBar: { display: 'flex', height: 8, overflow: 'hidden', borderRadius: 8, marginTop: theme.spacing(1) },
    formSection: { marginTop: theme.spacing(1) },
    empty: { padding: theme.spacing(6), textAlign: 'center', color: theme.palette.text.secondary },
}));

const formatDate = (value) => {
    if (!value) return '';
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? '' : date.toLocaleDateString();
};

const dateInputValue = (value) => {
    if (!value) return '';
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? '' : date.toISOString().slice(0, 10);
};

const errorMessage = (error) => error.response?.data?.error || error.message || 'Something went wrong.';

const normalizedHeader = (value) => String(value || '').toLowerCase().replace(/[^a-z0-9]/g, '');
const HEADER_TO_FIELD = {
    date: 'date', slitformno: 'slitFormNo', skelpno: 'skelpNo', coilno: 'skelpNo', hsprime: 'hsPrime',
    thickness: 'thickness', width: 'width', weightkg: 'weight', weight: 'weight',
    wtbefprocesskg: 'weightBefProc', wtbefprocessedkg: 'weightBefProc',
    weightbeforeprocess: 'weightBefProc', weightbeforeprocesskg: 'weightBefProc',
    fgtoproduce: 'fgToProduce',
    lengthoffg: 'lengthOfFg', status: 'status', dateprocessed: 'dateProcessed',
    productionformno: 'prodFormNo', prodformno: 'prodFormNo', remarks: 'remarks',
    operator: 'operator', location: 'location', otherremarks: 'otherRemarks',
};
const NUMERIC_FIELDS = new Set(['thickness', 'width', 'weight', 'weightBefProc', 'lengthOfFg']);

const excelDate = (value) => {
    if (typeof value === 'number') {
        const parsed = XLSX.SSF.parse_date_code(value);
        if (parsed) return `${parsed.y}-${String(parsed.m).padStart(2, '0')}-${String(parsed.d).padStart(2, '0')}`;
    }
    return dateInputValue(value);
};

const spreadsheetRow = (source) => {
    const item = emptyForm();
    Object.entries(source).forEach(([header, value]) => {
        const field = HEADER_TO_FIELD[normalizedHeader(header)];
        if (!field) return;
        if (NUMERIC_FIELDS.has(field)) item[field] = Number(value) || 0;
        else if (field === 'date' || field === 'dateProcessed') item[field] = excelDate(value);
        else item[field] = value == null ? '' : String(value).trim();
    });
    return item;
};

function StatusSummary({ rows, classes }) {
    const summaries = STATUS_VALUES.map((status) => ({
        status,
        weight: rows.filter((row) => row.status === status).reduce((sum, row) => sum + Number(row.weight || 0), 0),
    }));
    const total = summaries.reduce((sum, item) => sum + item.weight, 0);

    return (
        <>
            <Grid container spacing={2} className={classes.summaryGrid}>
                {summaries.map((item) => (
                    <Grid item xs={12} sm={6} md={3} key={item.status}>
                        <Card className={classes.summaryCard} style={{ borderLeftColor: STATUS_COLORS[item.status] }}>
                            <CardContent>
                                <Typography variant="caption" color="textSecondary">{item.status}</Typography>
                                <Typography variant="h6">{item.weight.toLocaleString()} kg</Typography>
                            </CardContent>
                        </Card>
                    </Grid>
                ))}
            </Grid>
            <div className={classes.statusBar} aria-label="Inventory weight by status">
                {summaries.map((item) => (
                    <div key={item.status} title={`${item.status}: ${item.weight} kg`} style={{
                        width: `${total ? (item.weight / total) * 100 : 25}%`,
                        background: STATUS_COLORS[item.status],
                    }} />
                ))}
            </div>
        </>
    );
}

function InventoryForm({ value, setValue, itemLabel }) {
    const change = (key) => (event) => setValue({ ...value, [key]: event.target.value });
    return (
        <Grid container spacing={2}>
            <Grid item xs={12} sm={6}><TextField fullWidth required type="date" label="Date" InputLabelProps={{ shrink: true }} value={value.date} onChange={change('date')} /></Grid>
            <Grid item xs={12} sm={6}><TextField fullWidth required label={`${itemLabel} No.`} value={value.skelpNo} onChange={change('skelpNo')} /></Grid>
            <Grid item xs={12} sm={6}><TextField fullWidth label="Slit Form No." value={value.slitFormNo} onChange={change('slitFormNo')} /></Grid>
            <Grid item xs={12} sm={6}><TextField fullWidth label="H / S / Prime" value={value.hsPrime} onChange={change('hsPrime')} /></Grid>
            <Grid item xs={12} sm={4}><TextField fullWidth type="number" label="Thickness" inputProps={{ min: 0, step: 'any' }} value={value.thickness} onChange={change('thickness')} /></Grid>
            <Grid item xs={12} sm={4}><TextField fullWidth type="number" label="Width" inputProps={{ min: 0, step: 'any' }} value={value.width} onChange={change('width')} /></Grid>
            <Grid item xs={12} sm={4}><TextField fullWidth type="number" label="Weight (kg)" inputProps={{ min: 0, step: 'any' }} value={value.weight} onChange={change('weight')} /></Grid>
            <Grid item xs={12} sm={6}><TextField fullWidth type="number" label="Weight Before Process (kg)" inputProps={{ min: 0, step: 'any' }} value={value.weightBefProc} onChange={change('weightBefProc')} /></Grid>
            <Grid item xs={12} sm={6}><TextField fullWidth label="FG to Produce" value={value.fgToProduce} onChange={change('fgToProduce')} /></Grid>
            <Grid item xs={12} sm={6}><TextField fullWidth type="number" label="Length of FG" inputProps={{ min: 0, step: 'any' }} value={value.lengthOfFg} onChange={change('lengthOfFg')} /></Grid>
            <Grid item xs={12} sm={6}><TextField fullWidth select label="Status" value={value.status} onChange={change('status')}>{STATUS_VALUES.map((status) => <MenuItem key={status} value={status}>{status}</MenuItem>)}</TextField></Grid>
            <Grid item xs={12} sm={6}><TextField fullWidth type="date" label="Date Processed" InputLabelProps={{ shrink: true }} value={value.dateProcessed} onChange={change('dateProcessed')} /></Grid>
            <Grid item xs={12} sm={6}><TextField fullWidth label="Production Form No." value={value.prodFormNo} onChange={change('prodFormNo')} /></Grid>
            <Grid item xs={12} sm={6}><TextField fullWidth label="Operator" value={value.operator} onChange={change('operator')} /></Grid>
            <Grid item xs={12} sm={6}><TextField fullWidth label="Location" value={value.location} onChange={change('location')} /></Grid>
            <Grid item xs={12} sm={6}><TextField fullWidth select label="Other Remarks" value={value.otherRemarks} onChange={change('otherRemarks')}><MenuItem value=""><em>None</em></MenuItem><MenuItem value="Moving">Moving</MenuItem><MenuItem value="Non Moving">Non Moving</MenuItem></TextField></Grid>
            <Grid item xs={12} sm={6}><TextField fullWidth multiline label="Remarks" value={value.remarks} onChange={change('remarks')} /></Grid>
        </Grid>
    );
}

function EditableCell({ row, columnKey, classes, editing, draftValue, saving, onStart, onChange, onCommit, onCancel }) {
    const derived = DERIVED_FIELDS.has(columnKey);
    const dateField = columnKey === 'date' || columnKey === 'dateProcessed';
    const displayValue = dateField
        ? (columnKey === 'dateProcessed' && row.status === 'Unprocessed' ? '' : formatDate(row[columnKey]))
        : row[columnKey];

    if (!editing) {
        return (
            <TableCell
                className={`${classes.cell} ${derived ? classes.derivedCell : classes.editableCell}`}
                onDoubleClick={() => !derived && onStart(row, columnKey)}
                title={derived ? 'Calculated automatically' : 'Double-click to edit'}
            >
                {saving ? <CircularProgress size={14} /> : displayValue}
            </TableCell>
        );
    }

    const commonProps = {
        autoFocus: true,
        className: classes.cellInput,
        size: 'small',
        variant: 'outlined',
        value: draftValue ?? '',
        onChange: (event) => onChange(event.target.value),
        onBlur: () => onCommit(row, columnKey),
        onKeyDown: (event) => {
            if (event.key === 'Enter') { event.preventDefault(); event.currentTarget.blur(); }
            if (event.key === 'Escape') { event.preventDefault(); onCancel(); }
        },
    };

    return (
        <TableCell className={classes.cell}>
            {columnKey === 'status' ? (
                <TextField {...commonProps} select>{STATUS_VALUES.map((status) => <MenuItem key={status} value={status}>{status}</MenuItem>)}</TextField>
            ) : columnKey === 'otherRemarks' ? (
                <TextField {...commonProps} select><MenuItem value=""><em>None</em></MenuItem><MenuItem value="Moving">Moving</MenuItem><MenuItem value="Non Moving">Non Moving</MenuItem></TextField>
            ) : (
                <TextField {...commonProps} type={dateField ? 'date' : CELL_NUMERIC_FIELDS.has(columnKey) ? 'number' : 'text'} inputProps={CELL_NUMERIC_FIELDS.has(columnKey) ? { min: 0, step: 'any' } : undefined} />
            )}
        </TableCell>
    );
}

function ProductionInventory({ view }) {
    const classes = useStyles();
    const fileInput = useRef(null);
    const [rows, setRows] = useState([]);
    const [loading, setLoading] = useState(true);
    const [query, setQuery] = useState('');
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(25);
    const [formOpen, setFormOpen] = useState(false);
    const [form, setForm] = useState(emptyForm());
    const [editingId, setEditingId] = useState(null);
    const [deleteRow, setDeleteRow] = useState(null);
    const [saving, setSaving] = useState(false);
    const [notice, setNotice] = useState(null);
    const [editingCell, setEditingCell] = useState(null);
    const [draftValue, setDraftValue] = useState('');
    const [cellSaving, setCellSaving] = useState(null);
    const isCoil = view === 'coil';
    const itemLabel = isCoil ? 'Coil' : 'Skelp';
    const api = `${window.apihost}inventory/${isCoil ? 'coils' : 'skelps'}`;

    const load = async () => {
        setLoading(true);
        try {
            const response = await axios.get(api);
            setRows(response.data);
        } catch (error) {
            setNotice({ severity: 'error', message: errorMessage(error) });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { load(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

    const filteredRows = useMemo(() => {
        const term = query.trim().toLowerCase();
        const result = term ? rows.filter((row) => Object.values(row).some((value) =>
            String(value ?? '').toLowerCase().includes(term))) : [...rows];
        return result.sort(isCoil
            ? (a, b) => Number(a.thickness) - Number(b.thickness) || String(b.date).localeCompare(String(a.date))
            : (a, b) => String(b.date).localeCompare(String(a.date)));
    }, [rows, query, isCoil]);

    const visibleRows = filteredRows.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);

    const openAdd = () => { setEditingId(null); setForm(emptyForm()); setFormOpen(true); };
    const openEdit = (row) => {
        setEditingId(row.id);
        setForm({ ...row, date: dateInputValue(row.date), dateProcessed: dateInputValue(row.dateProcessed) });
        setFormOpen(true);
    };

    const startCellEdit = (row, key) => {
        setEditingCell({ id: row.id, key });
        setDraftValue(key === 'date' || key === 'dateProcessed' ? dateInputValue(row[key]) : row[key] ?? '');
    };

    const saveCell = async (row, key) => {
        let value = CELL_NUMERIC_FIELDS.has(key) ? Number(draftValue) || 0 : draftValue;
        if (key === 'skelpNo' && !String(value).trim()) {
            setNotice({ severity: 'warning', message: `${itemLabel} No. is required.` });
            return;
        }
        setEditingCell(null);
        const cellKey = `${row.id}:${key}`;
        setCellSaving(cellKey);
        try {
            const response = await axios.put(`${api}/${row.id}`, { ...row, [key]: value });
            setRows((current) => current.map((item) => item.id === row.id ? response.data : item));
        } catch (error) {
            setNotice({ severity: 'error', message: errorMessage(error) });
        } finally {
            setCellSaving(null);
        }
    };

    const save = async () => {
        if (!form.skelpNo.trim()) {
            setNotice({ severity: 'warning', message: `${itemLabel} No. is required.` });
            return;
        }
        setSaving(true);
        try {
            if (editingId) await axios.put(`${api}/${editingId}`, form);
            else await axios.post(api, form);
            setFormOpen(false);
            setNotice({ severity: 'success', message: `Inventory record ${editingId ? 'updated' : 'added'}.` });
            await load();
        } catch (error) {
            setNotice({ severity: 'error', message: errorMessage(error) });
        } finally {
            setSaving(false);
        }
    };

    const remove = async () => {
        try {
            await axios.delete(`${api}/${deleteRow.id}`);
            setDeleteRow(null);
            setNotice({ severity: 'success', message: 'Inventory record deleted.' });
            await load();
        } catch (error) {
            setNotice({ severity: 'error', message: errorMessage(error) });
        }
    };

    const downloadWorkbook = (data, filename, sheetName) => {
        const sheet = XLSX.utils.json_to_sheet(data);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, sheet, sheetName);
        XLSX.writeFile(workbook, filename);
    };

    const downloadTemplate = () => {
        const headers = TEMPLATE_HEADERS.map((header) => isCoil && header === 'Skelp No.' ? 'Coil No.' : header);
        const sheet = XLSX.utils.aoa_to_sheet([headers]);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, sheet, `${itemLabel.toUpperCase()} Template`);
        XLSX.writeFile(workbook, `${itemLabel} Inventory (Template).xlsx`);
    };

    const exportToExcel = () => downloadWorkbook(filteredRows.map((row) => {
        const output = {};
        COLUMNS.forEach(([key, label]) => { output[label] = key.includes('date') ? formatDate(row[key]) : row[key]; });
        return output;
    }), `${isCoil ? 'Coil' : 'Skelp'} Inventory.xlsx`, isCoil ? 'COIL' : 'SKELP');

    const importExcel = async (event) => {
        const file = event.target.files[0];
        event.target.value = '';
        if (!file) return;
        try {
            const workbook = XLSX.read(await file.arrayBuffer(), { type: 'array', cellDates: true });
            const sourceRows = XLSX.utils.sheet_to_json(workbook.Sheets[workbook.SheetNames[0]], { defval: '' });
            const items = sourceRows.map(spreadsheetRow).filter((item) => item.skelpNo);
            if (!items.length) throw new Error('No rows with a Skelp No. were found in the workbook.');
            const response = await axios.post(`${api}/import`, items);
            setNotice({ severity: 'success', message: `${response.data.imported} rows imported.` });
            await load();
        } catch (error) {
            setNotice({ severity: 'error', message: errorMessage(error) });
        }
    };

    let previousThickness;
    return (
        <div className={classes.root}>
            {isCoil && <StatusSummary rows={filteredRows} classes={classes} />}
            <div className={classes.toolbar}>
                <TextField className={classes.search} size="small" variant="outlined" placeholder={`Search ${isCoil ? 'coil' : 'skelp'} inventory`} value={query} onChange={(event) => { setQuery(event.target.value); setPage(0); }} InputProps={{ startAdornment: <InputAdornment position="start"><Search /></InputAdornment> }} />
                <input ref={fileInput} hidden type="file" accept=".xlsx,.xls" onChange={importExcel} />
                <Button variant="outlined" startIcon={<CloudUpload />} onClick={() => fileInput.current.click()}>Import Excel</Button>
                <Button variant="outlined" startIcon={<GetApp />} onClick={exportToExcel}>Export Excel</Button>
                <Button variant="outlined" startIcon={<Description />} onClick={downloadTemplate}>Template</Button>
                <Button color="primary" variant="contained" startIcon={<Add />} onClick={openAdd}>Add {itemLabel}</Button>
            </div>

            <Typography variant="caption" color="textSecondary" style={{ display: 'block', marginBottom: 8 }}>
                Scroll horizontally to view all columns. Double-click any white data cell to edit it; press Enter or click outside to save.
            </Typography>
            <Paper variant="outlined" className={classes.tablePaper}>
                <TableContainer className={classes.tableContainer}>
                    <Table stickyHeader size="small" className={classes.table}>
                        <TableHead><TableRow>{COLUMNS.map(([key, label]) => <TableCell key={label} className={classes.headerCell}>{isCoil && key === 'skelpNo' ? 'Coil No.' : label}</TableCell>)}<TableCell className={classes.headerCell} align="center">Actions</TableCell></TableRow></TableHead>
                        <TableBody>
                            {loading && <TableRow><TableCell colSpan={COLUMNS.length + 1} className={classes.empty}><CircularProgress size={32} /></TableCell></TableRow>}
                            {!loading && !visibleRows.length && <TableRow><TableCell colSpan={COLUMNS.length + 1} className={classes.empty}>No inventory records found.</TableCell></TableRow>}
                            {!loading && visibleRows.map((row) => {
                                const showGroup = isCoil && previousThickness !== row.thickness;
                                previousThickness = row.thickness;
                                return (
                                    <React.Fragment key={row.id}>
                                        {showGroup && <TableRow className={classes.groupRow}><TableCell colSpan={COLUMNS.length + 1}><strong>Thickness: {row.thickness}</strong> &nbsp;·&nbsp; {filteredRows.filter((item) => item.thickness === row.thickness).length} item(s) &nbsp;·&nbsp; {filteredRows.filter((item) => item.thickness === row.thickness).reduce((sum, item) => sum + Number(item.weight || 0), 0).toLocaleString()} kg</TableCell></TableRow>}
                                        <TableRow hover>
                                            {COLUMNS.map(([key]) => <EditableCell
                                                key={key}
                                                row={row}
                                                columnKey={key}
                                                classes={classes}
                                                editing={editingCell?.id === row.id && editingCell?.key === key}
                                                draftValue={draftValue}
                                                saving={cellSaving === `${row.id}:${key}`}
                                                onStart={startCellEdit}
                                                onChange={setDraftValue}
                                                onCommit={saveCell}
                                                onCancel={() => setEditingCell(null)}
                                            />)}
                                            <TableCell align="center" className={classes.cell}>
                                                <Tooltip title="Edit"><IconButton size="small" color="primary" onClick={() => openEdit(row)}><Edit fontSize="small" /></IconButton></Tooltip>
                                                <Tooltip title="Delete"><IconButton size="small" color="secondary" onClick={() => setDeleteRow(row)}><Delete fontSize="small" /></IconButton></Tooltip>
                                            </TableCell>
                                        </TableRow>
                                    </React.Fragment>
                                );
                            })}
                        </TableBody>
                    </Table>
                </TableContainer>
                <TablePagination component="div" count={filteredRows.length} page={page} rowsPerPage={rowsPerPage} rowsPerPageOptions={[10, 25, 50, 100]} onChangePage={(_event, nextPage) => setPage(nextPage)} onChangeRowsPerPage={(event) => { setRowsPerPage(Number(event.target.value)); setPage(0); }} />
            </Paper>

            <Dialog open={formOpen} onClose={() => !saving && setFormOpen(false)} fullWidth maxWidth="md">
                <DialogTitle>{editingId ? `Edit ${itemLabel}` : `Add ${itemLabel}`}</DialogTitle>
                <DialogContent className={classes.formSection}><InventoryForm value={form} setValue={setForm} itemLabel={itemLabel} /></DialogContent>
                <DialogActions><Button onClick={() => setFormOpen(false)} disabled={saving}>Cancel</Button><Button color="primary" variant="contained" onClick={save} disabled={saving}>{saving ? 'Saving…' : 'Save'}</Button></DialogActions>
            </Dialog>

            <Dialog open={Boolean(deleteRow)} onClose={() => setDeleteRow(null)}>
                <DialogTitle>Delete inventory record?</DialogTitle>
                <DialogContent><Typography>This permanently deletes <strong>{deleteRow?.skelpNo}</strong>.</Typography></DialogContent>
                <DialogActions><Button onClick={() => setDeleteRow(null)}>Cancel</Button><Button color="secondary" variant="contained" onClick={remove}>Delete</Button></DialogActions>
            </Dialog>

            <Snackbar open={Boolean(notice)} autoHideDuration={5000} onClose={() => setNotice(null)} anchorOrigin={{ vertical: 'top', horizontal: 'center' }}>
                {notice ? <Alert elevation={6} variant="filled" severity={notice.severity} onClose={() => setNotice(null)}>{notice.message}</Alert> : undefined}
            </Snackbar>
        </div>
    );
}

export default ProductionInventory;

import React, { useMemo, useState } from 'react';
import {
    Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
    TextField, Typography
} from '@material-ui/core';
import { makeStyles } from '@material-ui/core/styles';
import { Search } from '@material-ui/icons';
import InputAdornment from '@material-ui/core/InputAdornment';

const GAUGE_DATA = [
    ['3', '0.2391', '6.073', '9.754', '47.624'], ['4', '0.2242', '5.695', '9.146', '44.656'],
    ['5', '0.2092', '5.314', '8.534', '41.668'], ['6', '0.1943', '4.935', '7.927', '38.701'],
    ['7', '0.1793', '4.554', '7.315', '35.713'], ['8', '0.1644', '4.176', '6.707', '32.745'],
    ['9', '0.1495', '3.797', '6.099', '29.777'], ['10', '0.1345', '3.416', '5.487', '26.790'],
    ['11', '0.1196', '3.038', '4.879', '23.822'], ['12', '0.1046', '2.657', '4.267', '20.834'],
    ['13', '0.0897', '2.278', '3.659', '17.866'], ['14', '0.0747', '1.897', '3.047', '14.879'],
    ['15', '0.0673', '1.709', '2.746', '13.405'], ['16', '0.0598', '1.519', '2.440', '11.911'],
    ['17', '0.0538', '1.367', '2.195', '10.716'], ['18', '0.0478', '1.214', '1.950', '9.521'],
    ['19', '0.0418', '1.062', '1.705', '8.326'], ['20', '0.0359', '0.912', '1.465', '7.151'],
    ['21', '0.0329', '0.836', '1.342', '6.553'], ['22', '0.0299', '0.759', '1.220', '5.955'],
    ['23', '0.0269', '0.683', '1.097', '5.358'], ['24', '0.0239', '0.607', '0.975', '4.760'],
    ['25', '0.0209', '0.531', '0.853', '4.163'], ['26', '0.0179', '0.455', '0.730', '3.565'],
    ['27', '0.0164', '0.417', '0.669', '3.267'], ['28', '0.0149', '0.378', '0.608', '2.968'],
    ['29', '0.0135', '0.343', '0.551', '2.689'], ['30', '0.0120', '0.305', '0.490', '2.390'],
    ['31', '0.0105', '0.267', '0.428', '2.091'], ['32', '0.0097', '0.246', '0.396', '1.932'],
    ['33', '0.0090', '0.229', '0.367', '1.793'], ['34', '0.0082', '0.208', '0.335', '1.633'],
    ['35', '0.0075', '0.191', '0.306', '1.494'], ['36', '0.0067', '0.170', '0.273', '1.335'],
    ['37', '0.0064', '0.163', '0.261', '1.275'], ['38', '0.0060', '0.152', '0.245', '1.195'],
];

const HEADERS = ['Gauge', 'in', 'mm', 'lb/ft²', 'kg/m²'];

const useStyles = makeStyles((theme) => ({
    root: { minWidth: 0 },
    header: {
        display: 'flex', gap: theme.spacing(2), alignItems: 'center', justifyContent: 'space-between',
        flexWrap: 'wrap', marginBottom: theme.spacing(2),
    },
    tableContainer: { maxHeight: 'calc(100vh - 210px)', minHeight: 420, overflowX: 'auto' },
    headerCell: { whiteSpace: 'nowrap', backgroundColor: theme.palette.type === 'dark' ? '#263244' : '#F1F5FF' },
    row: { '&:nth-of-type(odd)': { backgroundColor: theme.palette.action.hover } },
}));

function GaugeChart() {
    const classes = useStyles();
    const [search, setSearch] = useState('');
    const rows = useMemo(() => {
        const query = search.trim().toLowerCase();
        return query ? GAUGE_DATA.filter((row) => row.some((value) => value.toLowerCase().includes(query))) : GAUGE_DATA;
    }, [search]);

    return (
        <div className={classes.root}>
            <div className={classes.header}>
                <div>
                    <Typography variant="h5">Gauge Size Standard</Typography>
                    <Typography variant="body2" color="textSecondary">Steel sheet gauge, thickness, and unit-weight reference.</Typography>
                </div>
                <TextField
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                    placeholder="Search gauge or value"
                    InputProps={{ startAdornment: <InputAdornment position="start"><Search fontSize="small" /></InputAdornment> }}
                />
            </div>
            <TableContainer component={Paper} className={classes.tableContainer}>
                <Table stickyHeader size="small" aria-label="Gauge size standard">
                    <TableHead><TableRow>{HEADERS.map((header) => <TableCell key={header} className={classes.headerCell}>{header}</TableCell>)}</TableRow></TableHead>
                    <TableBody>
                        {rows.map((row) => <TableRow key={row[0]} hover className={classes.row}>{row.map((value, index) => <TableCell key={`${row[0]}-${HEADERS[index]}`}>{value}</TableCell>)}</TableRow>)}
                        {rows.length === 0 && <TableRow><TableCell colSpan={HEADERS.length} align="center">No matching gauge found.</TableCell></TableRow>}
                    </TableBody>
                </Table>
            </TableContainer>
        </div>
    );
}

export default GaugeChart;

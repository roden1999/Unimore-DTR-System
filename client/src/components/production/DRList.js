import React from 'react';
import {
    Paper, Typography, Grid, TextField, Button, Table, TableBody, TableCell,
    TableHead, TableRow
} from '@material-ui/core';
import { Search } from '@material-ui/icons';

// Scaffold for the "DR List" (Daily Receipt list) screen.
function DRList() {
    return (
        <Paper style={{ padding: 24, borderRadius: 14 }}>
            <Grid container spacing={2} alignItems="center" style={{ marginBottom: 12 }}>
                <Grid item><Typography variant="h6">Daily Receipts</Typography></Grid>
                <Grid item xs />
                <Grid item><TextField size="small" label="Search DR" InputProps={{ endAdornment: <Search fontSize="small" /> }} /></Grid>
            </Grid>

            <Table size="small">
                <TableHead>
                    <TableRow>
                        {['DR No.', 'Date', 'Customer', 'Reference', 'Total', 'Prepared By', 'Action'].map((h) => (
                            <TableCell key={h} align={h === 'Action' ? 'right' : 'left'}>{h}</TableCell>
                        ))}
                    </TableRow>
                </TableHead>
                <TableBody>
                    <TableRow>
                        <TableCell colSpan={7} align="center" style={{ color: '#94A3B8', padding: 40 }}>
                            No daily receipts yet — connect the Daily Receipt backend to list records here.
                        </TableCell>
                    </TableRow>
                </TableBody>
            </Table>
        </Paper>
    );
}

export default DRList;

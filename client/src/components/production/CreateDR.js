import React from 'react';
import { Paper, Typography, Grid, TextField, Button, Divider } from '@material-ui/core';
import { Add, Save } from '@material-ui/icons';

// Scaffold for the "Create DR" (Daily Receipt) screen. Layout is in
// place; wire it to a Daily Receipt backend when the spec is ready.
function CreateDR() {
    return (
        <Paper style={{ padding: 24, borderRadius: 14, maxWidth: 900, margin: '0 auto' }}>
            <Typography variant="h6" gutterBottom>Create Daily Receipt</Typography>
            <Typography variant="caption" color="textSecondary">
                Draft layout — connect to the Daily Receipt backend to enable saving.
            </Typography>
            <Divider style={{ margin: '16px 0' }} />

            <Grid container spacing={2}>
                <Grid item xs={12} sm={4}><TextField label="DR No." fullWidth /></Grid>
                <Grid item xs={12} sm={4}><TextField type="date" label="Date" InputLabelProps={{ shrink: true }} fullWidth /></Grid>
                <Grid item xs={12} sm={4}><TextField label="Prepared By" fullWidth /></Grid>
                <Grid item xs={12} sm={6}><TextField label="Customer / Received From" fullWidth /></Grid>
                <Grid item xs={12} sm={6}><TextField label="Reference / PO No." fullWidth /></Grid>
            </Grid>

            <Typography variant="subtitle2" style={{ marginTop: 20, marginBottom: 8 }}>Items</Typography>
            <Button size="small" variant="outlined" startIcon={<Add />}>Add Line</Button>
            <div style={{ marginTop: 12, border: '1px dashed #CBD5E1', borderRadius: 10, padding: 24, textAlign: 'center', color: '#94A3B8' }}>
                Item lines (description · quantity · unit · amount) will appear here.
            </div>

            <div style={{ marginTop: 20, textAlign: 'right' }}>
                <Button variant="contained" color="primary" startIcon={<Save />} disabled>Save DR</Button>
            </div>
        </Paper>
    );
}

export default CreateDR;

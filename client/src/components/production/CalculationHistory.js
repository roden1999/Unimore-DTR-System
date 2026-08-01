import React, { useCallback, useEffect, useState } from 'react';
import { Card, CardContent, Chip, IconButton, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Tooltip, Typography } from '@material-ui/core';
import { Delete, Refresh } from '@material-ui/icons';
import axios from 'axios';
import moment from 'moment';

const readable = value => {
    try { const parsed = JSON.parse(value); return Object.entries(parsed).map(([key, item]) => `${key}: ${item}`).join(' · '); }
    catch (_error) { return value; }
};

export default function CalculationHistory() {
    const [rows, setRows] = useState([]); const [error, setError] = useState('');
    const endpoint = window.apihost + 'workflow/calculator-history';
    const load = useCallback(() => axios.get(endpoint).then(r => setRows(r.data || [])).catch(e => setError(e.response?.data?.message || 'Unable to load history.')), [endpoint]);
    useEffect(load, [load]);
    const remove = async id => { if (!window.confirm('Remove this calculation from history?')) return; await axios.delete(`${endpoint}/${id}`); load(); };
    return <div><div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 18 }}><div><Typography variant="h5" style={{ fontWeight: 700 }}>Calculation History</Typography><Typography color="textSecondary">Saved results from the floating production calculator.</Typography></div><Tooltip title="Refresh"><IconButton onClick={load}><Refresh /></IconButton></Tooltip></div>{error && <Typography color="error">{error}</Typography>}<Card><CardContent style={{ padding: 0 }}><TableContainer><Table><TableHead><TableRow><TableCell>Date</TableCell><TableCell>Calculator</TableCell><TableCell>Inputs</TableCell><TableCell>Result</TableCell><TableCell align="right">Action</TableCell></TableRow></TableHead><TableBody>{!rows.length && <TableRow><TableCell colSpan={5} align="center" style={{ padding: 40 }}>No calculations saved yet.</TableCell></TableRow>}{rows.map(row => <TableRow key={row.Id}><TableCell style={{ whiteSpace: 'nowrap' }}>{moment(row.CreatedAt).format('MMM D, YYYY h:mm A')}</TableCell><TableCell><Chip size="small" label={row.CalculatorType} /></TableCell><TableCell>{readable(row.InputData)}</TableCell><TableCell style={{ fontWeight: 700 }}>{readable(row.ResultData)}</TableCell><TableCell align="right"><IconButton size="small" onClick={() => remove(row.Id)}><Delete fontSize="small" /></IconButton></TableCell></TableRow>)}</TableBody></Table></TableContainer></CardContent></Card></div>;
}

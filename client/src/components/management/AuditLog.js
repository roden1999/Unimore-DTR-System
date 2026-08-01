import React, { useCallback, useEffect, useState } from 'react';
import { Card, CardContent, Chip, IconButton, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Tooltip, Typography } from '@material-ui/core';
import { Refresh } from '@material-ui/icons';
import axios from 'axios';
import moment from 'moment';

export default function AuditLog() {
    const [rows, setRows] = useState([]); const [error, setError] = useState('');
    const load = useCallback(() => axios.get(window.apihost + 'workflow/audit?limit=300').then(r => setRows(r.data || [])).catch(e => setError(e.response?.data?.message || 'Unable to load audit log.')), []);
    useEffect(load, [load]);
    return <div><div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 18 }}><div><Typography variant="h5" style={{ fontWeight: 700 }}>Audit Trail</Typography><Typography color="textSecondary">A chronological record of workflow changes and approvals.</Typography></div><Tooltip title="Refresh"><IconButton onClick={load}><Refresh /></IconButton></Tooltip></div>{error && <Typography color="error">{error}</Typography>}
        <Card><CardContent style={{ padding: 0 }}><TableContainer style={{ maxHeight: 'calc(100vh - 190px)' }}><Table stickyHeader size="small"><TableHead><TableRow><TableCell>Date</TableCell><TableCell>User</TableCell><TableCell>Module</TableCell><TableCell>Action</TableCell><TableCell>Record</TableCell><TableCell>Description</TableCell></TableRow></TableHead><TableBody>{!rows.length && <TableRow><TableCell colSpan={6} align="center" style={{ padding: 40 }}>No activity recorded yet.</TableCell></TableRow>}{rows.map(row => <TableRow key={row.Id}><TableCell style={{ whiteSpace: 'nowrap' }}>{moment(row.CreatedAt).format('MMM D, YYYY h:mm A')}</TableCell><TableCell>{row.UserName}</TableCell><TableCell>{row.Module}</TableCell><TableCell><Chip size="small" label={row.Action} /></TableCell><TableCell>{row.EntityType} #{row.EntityId}</TableCell><TableCell>{row.Description}</TableCell></TableRow>)}</TableBody></Table></TableContainer></CardContent></Card>
    </div>;
}

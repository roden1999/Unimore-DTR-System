import React, { useCallback, useEffect, useState } from 'react';
import { Button, Card, CardContent, Chip, Dialog, DialogActions, DialogContent, DialogTitle, MenuItem, Snackbar, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, TextField, Typography } from '@material-ui/core';
import { Alert } from '@material-ui/lab';
import axios from 'axios';
import moment from 'moment';

export default function ApprovalCenter({ module, title = 'Approval Center' }) {
    const [rows, setRows] = useState([]); const [filter, setFilter] = useState('Pending'); const [selected, setSelected] = useState(null); const [note, setNote] = useState(''); const [message, setMessage] = useState(null);
    const load = useCallback(() => {
        const query = new URLSearchParams();
        if (filter) query.set('status', filter);
        if (module) query.set('module', module);
        return axios.get(window.apihost + `workflow/approvals?${query.toString()}`).then(r => setRows(r.data || [])).catch(e => setMessage({ type: 'error', text: e.response?.data?.message || 'Unable to load approvals.' }));
    }, [filter, module]);
    useEffect(load, [load]);
    const decide = async status => { try { await axios.put(window.apihost + `workflow/approvals/${selected.Id}/decision`, { status, note }); setSelected(null); setNote(''); setMessage({ type: 'success', text: `Request ${status.toLowerCase()}.` }); load(); } catch (e) { setMessage({ type: 'error', text: e.response?.data?.message || 'Could not save decision.' }); } };
    return <div><div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'end', marginBottom: 18 }}><div><Typography variant="h5" style={{ fontWeight: 700 }}>{title}</Typography><Typography color="textSecondary">Review employee leave and overtime requests.</Typography></div><TextField select variant="outlined" size="small" label="Status" value={filter} onChange={e => setFilter(e.target.value)} style={{ minWidth: 150 }}><MenuItem value="">All</MenuItem>{['Pending', 'Approved', 'Rejected'].map(s => <MenuItem key={s} value={s}>{s}</MenuItem>)}</TextField></div>
        <Card><CardContent style={{ padding: 0 }}><TableContainer><Table><TableHead><TableRow><TableCell>Module</TableCell><TableCell>Request</TableCell><TableCell>Requested by</TableCell><TableCell>Reason</TableCell><TableCell>Date</TableCell><TableCell>Status</TableCell><TableCell align="right">Action</TableCell></TableRow></TableHead><TableBody>{!rows.length && <TableRow><TableCell colSpan={7} align="center" style={{ padding: 40 }}>No approvals in this view.</TableCell></TableRow>}{rows.map(row => <TableRow key={row.Id}><TableCell>{row.Module}</TableCell><TableCell>{row.EntityType} #{row.EntityId}</TableCell><TableCell>{row.RequestedByName}</TableCell><TableCell>{row.Reason || '—'}</TableCell><TableCell>{moment(row.RequestedAt).format('MMM D, YYYY h:mm A')}</TableCell><TableCell><Chip size="small" label={row.Status} color={row.Status === 'Approved' ? 'primary' : row.Status === 'Rejected' ? 'secondary' : 'default'} /></TableCell><TableCell align="right">{row.Status === 'Pending' && <Button color="primary" onClick={() => setSelected(row)}>Review</Button>}</TableCell></TableRow>)}</TableBody></Table></TableContainer></CardContent></Card>
        <Dialog open={Boolean(selected)} onClose={() => setSelected(null)} fullWidth maxWidth="sm"><DialogTitle>Review {selected?.EntityType}</DialogTitle><DialogContent><Typography gutterBottom>{selected?.RequestedByName} requested approval for record #{selected?.EntityId}.</Typography><TextField fullWidth multiline rows={3} variant="outlined" margin="normal" label="Review note" value={note} onChange={e => setNote(e.target.value)} /></DialogContent><DialogActions><Button onClick={() => setSelected(null)}>Cancel</Button><Button color="secondary" variant="outlined" onClick={() => decide('Rejected')}>Reject</Button><Button color="primary" variant="contained" onClick={() => decide('Approved')}>Approve</Button></DialogActions></Dialog>
        <Snackbar open={Boolean(message)} autoHideDuration={5000} onClose={() => setMessage(null)}><Alert severity={message?.type || 'info'}>{message?.text}</Alert></Snackbar>
    </div>;
}

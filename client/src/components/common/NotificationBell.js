import React, { useCallback, useEffect, useState } from 'react';
import { Badge, Divider, IconButton, ListItemText, Menu, MenuItem, Typography } from '@material-ui/core';
import { Notifications } from '@material-ui/icons';
import axios from 'axios';
import moment from 'moment';

export default function NotificationBell({ navigate }) {
    const [items, setItems] = useState([]);
    const [anchor, setAnchor] = useState(null);
    const load = useCallback(() => axios.get(window.apihost + 'workflow/notifications').then(r => setItems(Array.isArray(r.data) ? r.data : [])).catch(() => {}), []);
    useEffect(() => { load(); const timer = setInterval(load, 60000); return () => clearInterval(timer); }, [load]);
    const unread = items.filter(item => !item.IsRead).length;
    const openItem = async (item) => {
        if (!item.IsRead) await axios.put(window.apihost + `workflow/notifications/${item.Id}/read`).catch(() => {});
        setAnchor(null); load();
        if (item.Link && navigate) navigate(item.Link);
    };
    return <>
        <IconButton color="inherit" aria-label={`${unread} unread notifications`} onClick={e => setAnchor(e.currentTarget)}>
            <Badge badgeContent={unread} color="secondary"><Notifications /></Badge>
        </IconButton>
        <Menu anchorEl={anchor} open={Boolean(anchor)} onClose={() => setAnchor(null)} PaperProps={{ style: { width: 360, maxHeight: 460 } }}>
            <Typography variant="subtitle1" style={{ padding: '8px 16px', fontWeight: 700 }}>Notifications</Typography>
            <Divider />
            {!items.length && <MenuItem disabled>No notifications yet</MenuItem>}
            {items.map(item => <MenuItem key={item.Id} onClick={() => openItem(item)} style={{ whiteSpace: 'normal', background: item.IsRead ? undefined : 'rgba(79,115,255,.08)' }}>
                <ListItemText primary={item.Title} secondary={<>{item.Message}<br />{moment(item.CreatedAt).fromNow()}</>} />
            </MenuItem>)}
        </Menu>
    </>;
}

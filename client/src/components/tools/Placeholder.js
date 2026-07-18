import React from 'react';
import { Paper, Typography } from '@material-ui/core';
import { Build } from '@material-ui/icons';

// Temporary placeholder for tools screens still being rebuilt on Material-UI.
function Placeholder({ title }) {
    return (
        <Paper style={{ padding: 48, textAlign: 'center', borderRadius: 14 }}>
            <Build style={{ fontSize: 56, color: '#CBD5E1', marginBottom: 12 }} />
            <Typography variant="h6" style={{ color: '#475569' }}>{title}</Typography>
            <Typography variant="body2" style={{ color: '#94A3B8', marginTop: 8 }}>
                This screen is being rebuilt on the new design and will be available shortly.
            </Typography>
        </Paper>
    );
}

export default Placeholder;

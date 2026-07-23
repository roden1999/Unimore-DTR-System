import React from 'react';
import { Paper, Typography } from '@material-ui/core';
import { Build } from '@material-ui/icons';

// Simple placeholder shown for Daily Receipt screens until the
// feature spec is available.
function UnderConstruction({ title }) {
    return (
        <Paper style={{ padding: 48, borderRadius: 14, maxWidth: 640, margin: '40px auto', textAlign: 'center' }}>
            <div style={{
                width: 84, height: 84, borderRadius: '50%', margin: '0 auto 20px',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: 'rgba(245,158,11,0.14)',
            }}>
                <Build style={{ fontSize: 40, color: '#F59E0B' }} />
            </div>
            <Typography variant="h6" gutterBottom>{title}</Typography>
            <Typography variant="body2" color="textSecondary">
                This feature is under construction and will be available soon.
            </Typography>
        </Paper>
    );
}

export default UnderConstruction;

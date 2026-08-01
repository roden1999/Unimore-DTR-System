import React from 'react';
import { Chip, Typography } from '@material-ui/core';
import RawLogs from '../dtr/rawLogs';
export default function BiometricLogs() {
    return <div><div style={{ marginBottom: 14 }}><div style={{ display: 'flex', alignItems: 'center', gap: 10 }}><Typography variant="h5" style={{ fontWeight: 700 }}>NIDEKA NU32 Attendance Logs</Typography><Chip size="small" color="primary" label="Biometric Device" /></div><Typography color="textSecondary">Import, review, filter and print raw attendance transactions exported from the NIDEKA NU32 device.</Typography></div><RawLogs deviceName="NIDEKA NU32" /></div>;
}

import { createMuiTheme } from '@material-ui/core/styles';

// A single modern theme applied app-wide. Because every HR component is
// built from Material-UI primitives (Button, Paper, Card, Table, inputs),
// styling them here modernizes the whole module at once.
const theme = createMuiTheme({
    palette: {
        primary: { main: '#4F73FF', light: '#7D97FF', dark: '#3454D1', contrastText: '#fff' },
        secondary: { main: '#06B6D4', light: '#4BC0C8', dark: '#0E7490', contrastText: '#fff' },
        background: { default: '#F4F6FB', paper: '#FFFFFF' },
        text: { primary: '#1F2937', secondary: '#6B7280' },
        success: { main: '#16A34A' },
        error: { main: '#DC2626' },
        warning: { main: '#F59E0B' },
    },
    shape: { borderRadius: 12 },
    typography: {
        fontFamily: '"Inter","Segoe UI",Roboto,"Helvetica Neue",Arial,sans-serif',
        h4: { fontWeight: 700 },
        h5: { fontWeight: 700 },
        h6: { fontWeight: 600 },
        subtitle1: { fontWeight: 600 },
        button: { textTransform: 'none', fontWeight: 600 },
    },
    overrides: {
        MuiButton: {
            root: { borderRadius: 10, paddingTop: 8, paddingBottom: 8 },
            contained: { boxShadow: '0 4px 12px rgba(79,115,255,0.20)' },
            containedPrimary: {
                background: 'linear-gradient(90deg,#4F73FF,#4BC0C8)',
                '&:hover': { background: 'linear-gradient(90deg,#3454D1,#06B6D4)' },
            },
        },
        MuiPaper: {
            rounded: { borderRadius: 14 },
            elevation1: { boxShadow: '0 6px 20px rgba(17,24,39,0.06)' },
        },
        MuiCard: {
            root: { borderRadius: 16, boxShadow: '0 8px 24px rgba(17,24,39,0.08)' },
        },
        MuiAppBar: {
            colorPrimary: { background: 'linear-gradient(90deg,#4F73FF,#4BC0C8)' },
        },
        MuiTableHead: {
            root: { backgroundColor: '#F1F5FF' },
        },
        MuiTableCell: {
            head: { fontWeight: 700, color: '#374151' },
            root: { borderBottom: '1px solid #EEF1F6' },
        },
        MuiTableRow: {
            root: { '&:hover': { backgroundColor: '#F8FAFF' } },
        },
        MuiOutlinedInput: {
            root: { borderRadius: 10 },
        },
        MuiDialog: {
            paper: { borderRadius: 16 },
        },
        MuiChip: {
            root: { borderRadius: 8, fontWeight: 600 },
        },
        MuiDrawer: {
            paper: { borderRight: 'none', boxShadow: '2px 0 16px rgba(17,24,39,0.05)' },
        },
    },
    props: {
        MuiButton: { disableElevation: false },
        MuiTextField: { variant: 'outlined', size: 'small' },
        MuiPaper: { elevation: 1 },
    },
});

export default theme;

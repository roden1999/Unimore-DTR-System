import { createMuiTheme } from '@material-ui/core/styles';

const createAppTheme = (mode = 'light') => {
    const dark = mode === 'dark';
    return createMuiTheme({
        palette: {
            type: mode,
            primary: { main: dark ? '#7D97FF' : '#4F73FF', light: '#9DADFF', dark: '#3454D1', contrastText: '#fff' },
            secondary: { main: '#06B6D4', light: '#4BC0C8', dark: '#0E7490', contrastText: '#fff' },
            background: { default: dark ? '#111827' : '#F4F6FB', paper: dark ? '#1F2937' : '#FFFFFF' },
            text: { primary: dark ? '#F3F4F6' : '#1F2937', secondary: dark ? '#9CA3AF' : '#6B7280' },
            success: { main: '#16A34A' }, error: { main: '#DC2626' }, warning: { main: '#F59E0B' },
        },
        shape: { borderRadius: 12 },
        typography: {
            fontFamily: '"Inter","Segoe UI",Roboto,"Helvetica Neue",Arial,sans-serif',
            h4: { fontWeight: 700 }, h5: { fontWeight: 700 }, h6: { fontWeight: 600 },
            subtitle1: { fontWeight: 600 }, button: { textTransform: 'none', fontWeight: 600 },
        },
        overrides: {
            MuiCssBaseline: {
                '@global': {
                    body: { transition: 'background-color .2s, color .2s' },
                    '*': { scrollbarColor: `${dark ? '#64748B' : '#A3A3A3'} ${dark ? '#1F2937' : '#F4F4F4'}` },
                    '*::-webkit-scrollbar': { width: 10, height: 10 },
                    '*::-webkit-scrollbar-track': { background: dark ? '#1F2937' : '#F4F4F4' },
                    '*::-webkit-scrollbar-thumb': {
                        background: dark ? '#64748B' : '#A3A3A3', borderRadius: 10,
                        border: `2px solid ${dark ? '#1F2937' : '#F4F4F4'}`,
                    },
                },
            },
            MuiButton: {
                root: { borderRadius: 10, paddingTop: 8, paddingBottom: 8 },
                contained: {
                    boxShadow: '0 4px 12px rgba(79,115,255,0.20)',
                    ...(dark ? { backgroundColor: '#2B3748', color: '#F3F4F6', '&:hover': { backgroundColor: '#37465A' } } : {}),
                },
                containedPrimary: { background: 'linear-gradient(90deg,#4F73FF,#4BC0C8)', '&:hover': { background: 'linear-gradient(90deg,#3454D1,#06B6D4)' } },
            },
            MuiPaper: { rounded: { borderRadius: 14 }, elevation1: { boxShadow: dark ? '0 6px 20px rgba(0,0,0,.25)' : '0 6px 20px rgba(17,24,39,.06)' } },
            MuiCard: { root: { borderRadius: 16, boxShadow: dark ? '0 8px 24px rgba(0,0,0,.28)' : '0 8px 24px rgba(17,24,39,.08)' } },
            MuiAppBar: { colorPrimary: { background: dark ? 'linear-gradient(90deg,#273B8D,#0E7490)' : 'linear-gradient(90deg,#4F73FF,#4BC0C8)' } },
            MuiTableHead: { root: { backgroundColor: dark ? '#263244' : '#F1F5FF' } },
            MuiTableCell: { head: { fontWeight: 700, color: dark ? '#E5E7EB' : '#374151' }, root: { borderBottom: `1px solid ${dark ? '#374151' : '#EEF1F6'}` } },
            MuiTableRow: { root: { '&:hover': { backgroundColor: dark ? '#273548' : '#F8FAFF' } } },
            MuiOutlinedInput: { root: { borderRadius: 10 } },
            MuiDialog: { paper: { borderRadius: 16 } }, MuiChip: { root: { borderRadius: 8, fontWeight: 600 } },
            MuiDrawer: { paper: { borderRight: 'none', boxShadow: dark ? '2px 0 16px rgba(0,0,0,.3)' : '2px 0 16px rgba(17,24,39,.05)' } },
        },
        props: { MuiButton: { disableElevation: false }, MuiTextField: { variant: 'outlined', size: 'small' }, MuiPaper: { elevation: 1 } },
    });
};

export default createAppTheme;

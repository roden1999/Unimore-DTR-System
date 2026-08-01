import React, { useState } from 'react';
import {
    Button, Card, CardContent, FormControlLabel, Grid, Paper, Radio,
    RadioGroup, TextField, Typography
} from '@material-ui/core';
import { makeStyles } from '@material-ui/core/styles';
import { Clear, Functions } from '@material-ui/icons';

const useStyles = makeStyles((theme) => ({
    root: { maxWidth: 1050, margin: '0 auto' },
    diagram: { width: '100%', height: 300, objectFit: 'cover', display: 'block' },
    result: {
        padding: theme.spacing(3), textAlign: 'center', height: '100%',
        display: 'flex', flexDirection: 'column', justifyContent: 'center',
    },
    resultValue: { color: theme.palette.primary.main, fontWeight: 700 },
    formula: { fontFamily: 'Consolas, monospace', marginTop: theme.spacing(1) },
    actions: { display: 'flex', gap: theme.spacing(1), marginTop: theme.spacing(2) },
    note: {
        marginTop: theme.spacing(2), padding: theme.spacing(2), borderLeft: `4px solid ${theme.palette.warning.main}`,
        backgroundColor: theme.palette.action.hover,
    },
}));

const toNumber = (value) => {
    const parsed = Number(value);
    return Number.isFinite(parsed) && parsed >= 0 ? parsed : 0;
};

function RoofLength() {
    const classes = useStyles();
    const [roofType, setRoofType] = useState('single');
    const [height, setHeight] = useState('');
    const [base, setBase] = useState('');
    const [result, setResult] = useState(0);
    const compute = (nextHeight = height, nextBase = base) => setResult(Math.sqrt((toNumber(nextHeight) ** 2) + (toNumber(nextBase) ** 2)));
    const changeHeight = (value) => { setHeight(value); compute(value, base); };
    const changeBase = (value) => { setBase(value); compute(height, value); };
    const clear = () => { setHeight(''); setBase(''); setResult(0); };

    return (
        <div className={classes.root}>
            <Typography variant="h5" gutterBottom>Roof Length</Typography>
            <Typography variant="body2" color="textSecondary" gutterBottom>Calculate the hypotenuse using the Pythagorean theorem: c = √(a² + b²).</Typography>

            <RadioGroup row value={roofType} onChange={(event) => setRoofType(event.target.value)}>
                <FormControlLabel value="single" control={<Radio color="primary" />} label="Single Aguas" />
                <FormControlLabel value="double" control={<Radio color="primary" />} label="Dos Aguas" />
            </RadioGroup>

            <Grid container spacing={3}>
                <Grid item xs={12} md={7}>
                    <Card><img className={classes.diagram} src={roofType === 'single' ? '/images/roofLengthDrawing.jpg' : '/images/roofLengthDrawing2.jpg'} alt={roofType === 'single' ? 'Single-slope roof length diagram' : 'Double-slope roof length diagram'} /></Card>
                </Grid>
                <Grid item xs={12} md={5}>
                    <Paper className={classes.result}>
                        <Typography variant="overline" color="textSecondary">Hypotenuse (c)</Typography>
                        <Typography variant="h3" className={classes.resultValue}>{result.toFixed(2)}</Typography>
                        <Typography variant="body2" color="textSecondary" className={classes.formula}>√({toNumber(height).toFixed(2)}² + {toNumber(base).toFixed(2)}²)</Typography>
                    </Paper>
                </Grid>
                <Grid item xs={12}>
                    <Card><CardContent>
                        <Grid container spacing={2}>
                            <Grid item xs={12} sm={6}><TextField fullWidth type="number" label="Height (a)" value={height} onChange={(event) => changeHeight(event.target.value)} inputProps={{ min: 0, step: 'any' }} /></Grid>
                            <Grid item xs={12} sm={6}><TextField fullWidth type="number" label="Base (b)" value={base} onChange={(event) => changeBase(event.target.value)} inputProps={{ min: 0, step: 'any' }} /></Grid>
                        </Grid>
                        <div className={classes.actions}>
                            <Button variant="outlined" color="secondary" startIcon={<Clear />} onClick={clear}>Clear</Button>
                            <Button variant="contained" color="primary" startIcon={<Functions />} onClick={() => compute()}>Compute</Button>
                        </div>
                        <div className={classes.note}><Typography variant="body2"><strong>Note:</strong> For a residential house, add 50 mm to the length. For a warehouse, add 75 mm.</Typography></div>
                    </CardContent></Card>
                </Grid>
            </Grid>
        </div>
    );
}

export default RoofLength;

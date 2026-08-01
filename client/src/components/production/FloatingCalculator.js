import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Paper, IconButton, Tabs, Tab, useTheme } from '@material-ui/core';
import { Close, DragIndicator } from '@material-ui/icons';
import axios from 'axios';

const UNIT_WEIGHT = 7.85; // kg/mm-m²
const COMMERCIAL_LENGTHS = [2440, 3050, 3660, 3000, 4000, 5000, 6000];
const CALCULATOR_WIDTH = 340;

const num = (value) => {
    const parsed = parseFloat(value);
    return Number.isNaN(parsed) ? 0 : parsed;
};
const fmt = (value) => (Number.isFinite(value) && value ? value.toFixed(2) : '0.00');

const calcCoilWeight = ({ od, id, width }) => {
    const outside = num(od) / 1000;
    const inside = num(id) / 1000;
    const area = (outside * outside * 3.1416 / 4) - (inside * inside * 3.1416 / 4);
    return area * num(width) * UNIT_WEIGHT;
};
const calcLength = ({ weight, width, thickness }) =>
    (num(weight) * 1000000) / (num(width) * num(thickness) * UNIT_WEIGHT);
const calcWidth = ({ weight, length, thickness }) =>
    (num(weight) * 1000000) / (num(length) * num(thickness) * UNIT_WEIGHT);
const calcThickness = ({ weight, length, width }) =>
    (num(weight) * 1000000) / (num(length) * num(width) * UNIT_WEIGHT);

const FIELDS = {
    0: [['od', 'Outside Diameter', 'mm'], ['id', 'Inside Diameter', 'mm'], ['width', 'Coil Width', 'mm']],
    1: [['weight', 'Weight', 'kg'], ['width', 'Width', 'mm'], ['thickness', 'Thickness', 'mm']],
    2: [['weight', 'Weight', 'kg'], ['length', 'Length', 'mm'], ['thickness', 'Thickness', 'mm']],
    3: [['weight', 'Weight', 'kg'], ['length', 'Length', 'mm'], ['width', 'Width', 'mm']],
};
const OUTPUTS = {
    0: ['Coil Weight', 'kg'], 1: ['Length', 'mm'], 2: ['Width', 'mm'], 3: ['Thickness', 'mm'],
};

const evaluateExpression = (rawExpression) => {
    const expression = rawExpression.replace(/×/g, '*').replace(/÷/g, '/').replace(/\s/g, '');
    if (!expression || /[^0-9+\-*/.]/.test(expression)) throw new Error('Invalid expression');
    let index = 0;

    const parseNumber = () => {
        let sign = 1;
        if (expression[index] === '-') { sign = -1; index += 1; }
        else if (expression[index] === '+') index += 1;
        const start = index;
        let decimalPoints = 0;
        while (index < expression.length && /[0-9.]/.test(expression[index])) {
            if (expression[index] === '.') decimalPoints += 1;
            index += 1;
        }
        if (start === index || decimalPoints > 1) throw new Error('Invalid number');
        const value = Number(expression.slice(start, index));
        if (!Number.isFinite(value)) throw new Error('Invalid number');
        return sign * value;
    };

    const parseTerm = () => {
        let value = parseNumber();
        while (expression[index] === '*' || expression[index] === '/') {
            const operator = expression[index++];
            const next = parseNumber();
            if (operator === '/' && next === 0) throw new Error('Cannot divide by zero');
            value = operator === '*' ? value * next : value / next;
        }
        return value;
    };

    const parseSum = () => {
        let value = parseTerm();
        while (expression[index] === '+' || expression[index] === '-') {
            const operator = expression[index++];
            const next = parseTerm();
            value = operator === '+' ? value + next : value - next;
        }
        return value;
    };

    const result = parseSum();
    if (index !== expression.length || !Number.isFinite(result)) throw new Error('Invalid expression');
    return result;
};

const displayResult = (value) => {
    if (value === 'Error') return value;
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed.toLocaleString('en-US', { maximumFractionDigits: 10 }) : '0';
};

function FloatingCalculator({ onClose }) {
    const theme = useTheme();
    const panelRef = useRef(null);
    const drag = useRef(null);
    const [pos, setPos] = useState({ x: Math.max(12, window.innerWidth - CALCULATOR_WIDTH - 24), y: 90 });
    const [tab, setTab] = useState(0);
    const [vals, setVals] = useState({});
    const [expression, setExpression] = useState('');
    const [normalResult, setNormalResult] = useState('0');
    const [justEvaluated, setJustEvaluated] = useState(false);

    const onMouseMove = useCallback((event) => {
        if (!drag.current) return;
        const width = panelRef.current?.offsetWidth || CALCULATOR_WIDTH;
        const height = panelRef.current?.offsetHeight || 420;
        setPos({
            x: Math.max(0, Math.min(event.clientX - drag.current.dx, window.innerWidth - width)),
            y: Math.max(0, Math.min(event.clientY - drag.current.dy, window.innerHeight - Math.min(height, window.innerHeight))),
        });
    }, []);
    const onMouseUp = useCallback(() => { drag.current = null; }, []);

    useEffect(() => {
        window.addEventListener('mousemove', onMouseMove);
        window.addEventListener('mouseup', onMouseUp);
        return () => {
            window.removeEventListener('mousemove', onMouseMove);
            window.removeEventListener('mouseup', onMouseUp);
        };
    }, [onMouseMove, onMouseUp]);

    const handleNormalInput = useCallback((input) => {
        if (input === 'AC') {
            setExpression('');
            setNormalResult('0');
            setJustEvaluated(false);
            return;
        }
        if (input === 'BACKSPACE') {
            setExpression((current) => current.slice(0, -1));
            setJustEvaluated(false);
            return;
        }
        if (input === '=') {
            if (!expression) return;
            try {
                const result = String(evaluateExpression(expression));
                setNormalResult(result);
                axios.post(window.apihost + 'workflow/calculator-history', {
                    CalculatorType: 'Normal', InputData: JSON.stringify({ expression }), ResultData: JSON.stringify({ result }),
                }).catch(() => {});
            } catch (_error) {
                setNormalResult('Error');
            }
            setJustEvaluated(true);
            return;
        }

        const operator = ['+', '-', '×', '÷'].includes(input);
        if (operator) {
            setExpression((current) => {
                let next = justEvaluated ? (normalResult === 'Error' ? '' : normalResult) : current;
                if (!next) return input === '-' ? '-' : '';
                return /[+\-×÷]$/.test(next) ? `${next.slice(0, -1)}${input}` : `${next}${input}`;
            });
            setJustEvaluated(false);
            return;
        }

        if (justEvaluated) setNormalResult('0');
        setExpression((current) => {
            const next = justEvaluated ? '' : current;
            if (input === '.') {
                const currentNumber = next.split(/[+\-×÷]/).pop();
                if (currentNumber.includes('.')) return next;
                return `${next}${currentNumber ? '' : '0'}.`;
            }
            return `${next}${input}`;
        });
        setJustEvaluated(false);
    }, [expression, justEvaluated, normalResult]);

    useEffect(() => {
        const onKeyDown = (event) => {
            if (tab !== 0) return;
            const target = event.target;
            const editingAnotherField = target && (['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName) || target.isContentEditable)
                && !panelRef.current?.contains(target);
            if (editingAnotherField) return;

            const keyMap = { '*': '×', 'x': '×', 'X': '×', '/': '÷', Enter: '=', Escape: 'AC', Delete: 'AC', Backspace: 'BACKSPACE', ',': '.' };
            const input = keyMap[event.key] || event.key;
            if (/^[0-9]$/.test(input) || ['+', '-', '×', '÷', '.', '=', 'AC', 'BACKSPACE'].includes(input)) {
                event.preventDefault();
                handleNormalInput(input);
            }
        };
        window.addEventListener('keydown', onKeyDown);
        return () => window.removeEventListener('keydown', onKeyDown);
    }, [handleNormalInput, tab]);

    const startDrag = (event) => { drag.current = { dx: event.clientX - pos.x, dy: event.clientY - pos.y }; };
    const coilTab = tab - 1;
    const current = vals[coilTab] || {};
    const coilResult = tab === 0 ? 0 : [calcCoilWeight, calcLength, calcWidth, calcThickness][coilTab](current);
    const output = tab === 0 ? null : OUTPUTS[coilTab];
    const setValue = (key, value) => setVals((state) => ({ ...state, [coilTab]: { ...(state[coilTab] || {}), [key]: value } }));
    const clearCoil = () => setVals((state) => ({ ...state, [coilTab]: {} }));
    const saveCoil = () => {
        if (!Number.isFinite(coilResult) || coilResult <= 0) return;
        axios.post(window.apihost + 'workflow/calculator-history', {
            CalculatorType: OUTPUTS[coilTab][0], InputData: JSON.stringify(current),
            ResultData: JSON.stringify({ value: Number(coilResult.toFixed(4)), unit: OUTPUTS[coilTab][1] }),
        }).catch(() => {});
    };

    const keyStyle = (key) => ({
        border: 'none', borderRadius: 9, padding: '11px 6px', fontSize: 15, fontWeight: 600, cursor: 'pointer',
        gridColumn: key === '0' || key === '=' ? 'span 2' : 'span 1',
        color: key === '=' ? '#fff' : ['AC', 'BACKSPACE', '÷', '×', '-', '+'].includes(key) ? theme.palette.primary.main : theme.palette.text.primary,
        background: key === '=' ? 'linear-gradient(90deg,#4F73FF,#4BC0C8)' : theme.palette.action.hover,
    });

    return (
        <Paper ref={panelRef} elevation={8} style={{
            position: 'fixed', left: pos.x, top: pos.y, width: Math.min(CALCULATOR_WIDTH, window.innerWidth - 24),
            zIndex: 13000, borderRadius: 12, overflow: 'hidden', userSelect: 'none',
        }}>
            <div onMouseDown={startDrag} style={{
                cursor: 'move', background: 'linear-gradient(90deg,#4F73FF,#4BC0C8)', color: '#fff',
                display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '4px 8px',
            }}>
                <span style={{ display: 'flex', alignItems: 'center', fontSize: 13, fontWeight: 600 }}>
                    <DragIndicator fontSize="small" style={{ marginRight: 4 }} /> Production Calculator
                </span>
                <IconButton size="small" onMouseDown={(event) => event.stopPropagation()} onClick={onClose} style={{ color: '#fff' }}><Close fontSize="small" /></IconButton>
            </div>

            <Tabs value={tab} onChange={(_event, value) => setTab(value)} variant="fullWidth" indicatorColor="primary" textColor="primary" style={{ minHeight: 38 }}>
                {['Normal', 'Weight', 'Length', 'Width', 'Thick.'].map((label) => <Tab key={label} label={label} style={{ minHeight: 38, minWidth: 0, fontSize: 10, padding: 0 }} />)}
            </Tabs>

            {tab === 0 ? (
                <div style={{ padding: 12 }}>
                    <div style={{ padding: '10px 12px', background: 'var(--app-bg-muted)', borderRadius: 10, textAlign: 'right', marginBottom: 10, overflow: 'hidden' }}>
                        <div style={{ minHeight: 20, color: theme.palette.text.secondary, fontSize: 13, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{expression || '0'}</div>
                        <div style={{ minHeight: 34, color: normalResult === 'Error' ? theme.palette.error.main : theme.palette.text.primary, fontSize: 27, fontWeight: 700, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{displayResult(normalResult)}</div>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 7 }}>
                        {['AC', 'BACKSPACE', '.', '÷', '7', '8', '9', '×', '4', '5', '6', '-', '1', '2', '3', '+', '0', '='].map((key) => (
                            <button key={key} type="button" onClick={() => handleNormalInput(key)} style={keyStyle(key)} aria-label={key === 'BACKSPACE' ? 'Backspace' : key}>
                                {key === 'BACKSPACE' ? '⌫' : key}
                            </button>
                        ))}
                    </div>
                    <div style={{ marginTop: 9, textAlign: 'center', color: theme.palette.text.secondary, fontSize: 10 }}>Keyboard and numpad ready · Enter = result · Esc = clear</div>
                </div>
            ) : (
                <>
                    <div style={{ padding: '12px 12px 4px', background: 'var(--app-bg-muted)', textAlign: 'right' }}>
                        <div style={{ fontSize: 11, color: theme.palette.text.secondary }}>{output[0]}</div>
                        <div style={{ fontSize: 24, fontWeight: 700, color: theme.palette.text.primary, lineHeight: 1.1 }}>
                            {fmt(coilResult)} <span style={{ fontSize: 12, fontWeight: 500, color: theme.palette.text.secondary }}>{output[1]}</span>
                        </div>
                    </div>
                    <div style={{ padding: 12 }}>
                        {FIELDS[coilTab].map(([key, label, unit]) => (
                            <div key={key} style={{ marginBottom: 8 }}>
                                <div style={{ fontSize: 11, color: theme.palette.text.secondary, marginBottom: 2 }}>{label}</div>
                                <div style={{ display: 'flex', alignItems: 'center', border: `1px solid ${theme.palette.divider}`, borderRadius: 8, overflow: 'hidden' }}>
                                    <input type="number" min="0" value={current[key] || ''} onChange={(event) => setValue(key, event.target.value)} style={{ flex: 1, border: 'none', outline: 'none', padding: '7px 8px', fontSize: 14, width: '100%', background: theme.palette.background.paper, color: theme.palette.text.primary }} />
                                    <span style={{ fontSize: 11, color: theme.palette.text.secondary, padding: '0 8px' }}>{unit}</span>
                                </div>
                            </div>
                        ))}

                        {coilTab === 1 && Number.isFinite(coilResult) && coilResult > 0 && (
                            <div style={{ marginTop: 4, marginBottom: 8, background: 'var(--app-bg-subtle)', borderRadius: 8, padding: '6px 8px' }}>
                                <div style={{ fontSize: 10, color: theme.palette.text.secondary, marginBottom: 2 }}>Sheets per commercial length</div>
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 2 }}>
                                    {COMMERCIAL_LENGTHS.map((length) => <div key={length} style={{ fontSize: 11, color: theme.palette.text.secondary }}>{length}mm: <b>{(coilResult / length).toFixed(2)}</b></div>)}
                                </div>
                            </div>
                        )}

                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={{ fontSize: 10, color: theme.palette.text.secondary }}>Unit Wt. {UNIT_WEIGHT} kg/mm-m²</span>
                            <span><button type="button" onClick={saveCoil} disabled={!coilResult} style={{ border: 'none', background: 'var(--app-primary)', color: '#fff', cursor: 'pointer', borderRadius: 8, padding: '6px 12px', marginRight: 6, fontSize: 13, fontWeight: 600 }}>Save</button><button type="button" onClick={clearCoil} style={{ border: 'none', background: 'var(--app-bg-muted)', color: 'var(--app-primary)', cursor: 'pointer', borderRadius: 8, padding: '6px 12px', fontSize: 13, fontWeight: 600 }}>Clear</button></span>
                        </div>
                    </div>
                </>
            )}
        </Paper>
    );
}

export default FloatingCalculator;

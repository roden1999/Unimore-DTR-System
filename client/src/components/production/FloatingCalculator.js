import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Paper, IconButton, Tabs, Tab } from '@material-ui/core';
import { Close, DragIndicator } from '@material-ui/icons';

// Draggable coil calculator ported from the UnimorePocketCalculator mobile
// app. Computes coil weight / length / width / thickness of a metal coil.
// Stays mounted (state preserved) until the user hits Close.
const UNIT_WEIGHT = 7.85; // kg/mm-m2
const COMMERCIAL_LENGTHS = [2440, 3050, 3660, 3000, 4000, 5000, 6000];

const num = (v) => {
    const n = parseFloat(v);
    return isNaN(n) ? 0 : n;
};
const fmt = (n) => (isFinite(n) && n ? n.toFixed(2) : '0.00');

// --- formulas (identical to the mobile app) ---
const calcCoilWeight = ({ od, id, width }) => {
    const o = num(od) / 1000, i = num(id) / 1000;
    const a = (o * o * 3.1416 / 4) - (i * i * 3.1416 / 4);
    return a * num(width) * UNIT_WEIGHT;
};
const calcLength = ({ weight, width, thickness }) =>
    (num(weight) * 1000000) / (num(width) * num(thickness) * UNIT_WEIGHT);
const calcWidth = ({ weight, length, thickness }) =>
    (num(weight) * 1000000) / (num(length) * num(thickness) * UNIT_WEIGHT);
const calcThickness = ({ weight, length, width }) =>
    (num(weight) * 1000000) / (num(length) * num(width) * UNIT_WEIGHT);

const FIELDS = {
    0: [['od', 'Outside Diameter', 'mm'], ['id', 'Inside Diameter', 'mm'], ['width', 'Coil Width', 'mm']],
    1: [['weight', 'Weight', 'Kg/s'], ['width', 'Width', 'mm'], ['thickness', 'Thickness', 'mm']],
    2: [['weight', 'Weight', 'Kg/s'], ['length', 'Length', 'mm'], ['thickness', 'Thickness', 'mm']],
    3: [['weight', 'Weight', 'Kg/s'], ['length', 'Length', 'mm'], ['width', 'Width', 'mm']],
};
const OUTPUTS = {
    0: ['Coil Weight', 'Kg/s'], 1: ['Length', 'mm'], 2: ['Width', 'mm'], 3: ['Thickness', 'mm'],
};

function FloatingCalculator({ onClose }) {
    const [pos, setPos] = useState({ x: window.innerWidth - 320, y: 90 });
    const [tab, setTab] = useState(0);
    const [vals, setVals] = useState({});
    const drag = useRef(null);

    const onMouseMove = useCallback((e) => {
        if (!drag.current) return;
        setPos({ x: e.clientX - drag.current.dx, y: e.clientY - drag.current.dy });
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

    const startDrag = (e) => { drag.current = { dx: e.clientX - pos.x, dy: e.clientY - pos.y }; };

    const setV = (k, v) => setVals((s) => ({ ...s, [tab]: { ...(s[tab] || {}), [k]: v } }));
    const clear = () => setVals((s) => ({ ...s, [tab]: {} }));

    const current = vals[tab] || {};
    const result = [calcCoilWeight, calcLength, calcWidth, calcThickness][tab](current);
    const [outLabel, outUnit] = OUTPUTS[tab];

    return (
        <Paper elevation={8} style={{
            position: 'fixed', left: pos.x, top: pos.y, width: 288, zIndex: 13000,
            borderRadius: 12, overflow: 'hidden', userSelect: 'none',
        }}>
            <div onMouseDown={startDrag} style={{
                cursor: 'move', background: 'linear-gradient(90deg,#4F73FF,#4BC0C8)', color: '#fff',
                display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '4px 8px',
            }}>
                <span style={{ display: 'flex', alignItems: 'center', fontSize: 13, fontWeight: 600 }}>
                    <DragIndicator fontSize="small" style={{ marginRight: 4 }} /> Coil Calculator
                </span>
                <IconButton size="small" onClick={onClose} style={{ color: '#fff' }}><Close fontSize="small" /></IconButton>
            </div>

            <Tabs value={tab} onChange={(e, v) => setTab(v)} variant="fullWidth" indicatorColor="primary"
                textColor="primary" style={{ minHeight: 38 }}>
                {['Weight', 'Length', 'Width', 'Thick.'].map((t) => (
                    <Tab key={t} label={t} style={{ minHeight: 38, minWidth: 0, fontSize: 11, padding: 0 }} />
                ))}
            </Tabs>

            <div style={{ padding: '12px 12px 4px', background: '#F0F5FF', textAlign: 'right' }}>
                <div style={{ fontSize: 11, color: '#64748B' }}>{outLabel}</div>
                <div style={{ fontSize: 24, fontWeight: 700, color: '#1F2937', lineHeight: 1.1 }}>
                    {fmt(result)} <span style={{ fontSize: 12, fontWeight: 500, color: '#94A3B8' }}>{outUnit}</span>
                </div>
            </div>

            <div style={{ padding: 12 }}>
                {FIELDS[tab].map(([k, label, unit]) => (
                    <div key={k} style={{ marginBottom: 8 }}>
                        <div style={{ fontSize: 11, color: '#64748B', marginBottom: 2 }}>{label}</div>
                        <div style={{ display: 'flex', alignItems: 'center', border: '1px solid #CBD5E1', borderRadius: 8, overflow: 'hidden' }}>
                            <input type="number" min="0" value={current[k] || ''} onChange={(e) => setV(k, e.target.value)}
                                style={{ flex: 1, border: 'none', outline: 'none', padding: '7px 8px', fontSize: 14, width: '100%' }} />
                            <span style={{ fontSize: 11, color: '#94A3B8', padding: '0 8px' }}>{unit}</span>
                        </div>
                    </div>
                ))}

                {tab === 1 && isFinite(result) && result > 0 && (
                    <div style={{ marginTop: 4, marginBottom: 8, background: '#F8FAFC', borderRadius: 8, padding: '6px 8px' }}>
                        <div style={{ fontSize: 10, color: '#94A3B8', marginBottom: 2 }}>Sheets per commercial length</div>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 2 }}>
                            {COMMERCIAL_LENGTHS.map((c) => (
                                <div key={c} style={{ fontSize: 11, color: '#475569' }}>
                                    {c}mm: <b>{(result / c).toFixed(2)}</b>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: 10, color: '#94A3B8' }}>Unit Wt. {UNIT_WEIGHT} kg/mm-m²</span>
                    <button onClick={clear} style={{
                        border: 'none', background: '#EEF2FF', color: '#4F46E5', cursor: 'pointer',
                        borderRadius: 8, padding: '6px 16px', fontSize: 13, fontWeight: 600,
                    }}>Clear</button>
                </div>
            </div>
        </Paper>
    );
}

export default FloatingCalculator;

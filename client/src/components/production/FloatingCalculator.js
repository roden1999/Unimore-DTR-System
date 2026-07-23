import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Paper, IconButton } from '@material-ui/core';
import { Close, DragIndicator, Backspace } from '@material-ui/icons';

// Small draggable calculator that floats above the Production module.
// It stays mounted (state preserved) until the user hits Close.
const KEYS = [
    ['C', '(', ')', '÷'],
    ['7', '8', '9', '×'],
    ['4', '5', '6', '−'],
    ['1', '2', '3', '+'],
    ['0', '.', '⌫', '='],
];

function FloatingCalculator({ onClose }) {
    const [pos, setPos] = useState({ x: window.innerWidth - 270, y: 90 });
    const [expr, setExpr] = useState('');
    const [result, setResult] = useState('');
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

    const startDrag = (e) => {
        drag.current = { dx: e.clientX - pos.x, dy: e.clientY - pos.y };
    };

    const evaluate = (raw) => {
        const cleaned = raw.replace(/÷/g, '/').replace(/×/g, '*').replace(/−/g, '-');
        // eslint-disable-next-line no-new-func
        return Function(`"use strict"; return (${cleaned})`)();
    };

    const press = (k) => {
        if (k === 'C') { setExpr(''); setResult(''); return; }
        if (k === '⌫') { setExpr((e) => e.slice(0, -1)); return; }
        if (k === '=') {
            try { setResult(String(evaluate(expr))); } catch { setResult('Error'); }
            return;
        }
        setExpr((e) => e + k);
    };

    return (
        <Paper elevation={8} style={{
            position: 'fixed', left: pos.x, top: pos.y, width: 236, zIndex: 13000,
            borderRadius: 12, overflow: 'hidden', userSelect: 'none',
        }}>
            <div onMouseDown={startDrag} style={{
                cursor: 'move', background: 'linear-gradient(90deg,#4F73FF,#4BC0C8)', color: '#fff',
                display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '4px 8px',
            }}>
                <span style={{ display: 'flex', alignItems: 'center', fontSize: 13, fontWeight: 600 }}>
                    <DragIndicator fontSize="small" style={{ marginRight: 4 }} /> Calculator
                </span>
                <IconButton size="small" onClick={onClose} style={{ color: '#fff' }}><Close fontSize="small" /></IconButton>
            </div>

            <div style={{ padding: 8, background: '#F8FAFC', textAlign: 'right', minHeight: 44 }}>
                <div style={{ fontSize: 12, color: '#94A3B8', height: 16, overflow: 'hidden' }}>{expr || ' '}</div>
                <div style={{ fontSize: 20, fontWeight: 700, color: '#1F2937' }}>{result || '0'}</div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 1, background: '#E5E7EB' }}>
                {KEYS.flat().map((k) => (
                    <button key={k} onClick={() => press(k)} style={{
                        border: 'none', outline: 'none', cursor: 'pointer', padding: '12px 0', fontSize: 15,
                        background: k === '=' ? '#4F73FF' : (['÷', '×', '−', '+', 'C', '(', ')', '⌫'].includes(k) ? '#EEF2FF' : '#fff'),
                        color: k === '=' ? '#fff' : (k === 'C' ? '#DC2626' : '#1F2937'),
                        fontWeight: k === '=' ? 700 : 500,
                    }}>
                        {k === '⌫' ? <Backspace fontSize="small" /> : k}
                    </button>
                ))}
            </div>
        </Paper>
    );
}

export default FloatingCalculator;

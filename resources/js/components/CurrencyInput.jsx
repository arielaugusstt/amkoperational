import React from 'react';
import { formatRupiah, parseRupiah } from '../utils/formatters';

export default function CurrencyInput({
    value,
    onChange,
    placeholder = 'Rp 0',
    className = '',
    disabled = false,
    id,
    name,
}) {
    const handleChange = (e) => {
        const raw = e.target.value;
        const num = parseRupiah(raw);
        onChange(num);
    };

    const displayValue = value ? formatRupiah(value) : '';

    return (
        <input
            type="text"
            inputMode="numeric"
            id={id}
            name={name}
            value={displayValue}
            onChange={handleChange}
            placeholder={placeholder}
            disabled={disabled}
            className={`w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-base font-semibold text-slate-800 shadow-sm transition placeholder:text-slate-400 focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500/20 disabled:bg-slate-100 disabled:text-slate-500 ${className}`}
        />
    );
}

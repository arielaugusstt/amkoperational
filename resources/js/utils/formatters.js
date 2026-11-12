export function formatRupiah(value) {
    if (value === null || value === undefined || value === '') return 'Rp 0';
    const num = typeof value === 'string' ? parseInt(value.replace(/[^0-9-]/g, ''), 10) || 0 : Math.round(value);
    return 'Rp ' + num.toLocaleString('id-ID');
}

export function parseRupiah(value) {
    if (typeof value === 'number') return Math.round(value);
    if (!value) return 0;
    const clean = value.toString().replace(/[^0-9-]/g, '');
    return parseInt(clean, 10) || 0;
}

export function formatDateIndo(dateStr) {
    if (!dateStr) return '';
    try {
        const d = new Date(dateStr + 'T00:00:00');
        return d.toLocaleDateString('id-ID', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    } catch (e) {
        return dateStr;
    }
}


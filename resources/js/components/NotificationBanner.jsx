import React from 'react';
import { RefreshCw, CheckCircle, AlertTriangle, X } from 'lucide-react';

export default function NotificationBanner({ message, type = 'info', onDismiss }) {
    if (!message) return null;

    const styles = {
        info: 'bg-blue-50 border-blue-200 text-blue-900',
        restore: 'bg-amber-50 border-amber-300 text-amber-950 animate-pulse',
        success: 'bg-emerald-50 border-emerald-300 text-emerald-950',
        error: 'bg-rose-50 border-rose-300 text-rose-950',
    };

    const icon = {
        info: <RefreshCw className="h-5 w-5 text-blue-600 shrink-0" />,
        restore: <RefreshCw className="h-5 w-5 text-amber-700 shrink-0" />,
        success: <CheckCircle className="h-5 w-5 text-emerald-600 shrink-0" />,
        error: <AlertTriangle className="h-5 w-5 text-rose-600 shrink-0" />,
    }[type];

    return (
        <div className={`mb-4 flex items-center justify-between rounded-xl border p-3.5 shadow-sm text-sm font-semibold transition ${styles[type] || styles.info}`}>
            <div className="flex items-center space-x-3">
                {icon}
                <span>{message}</span>
            </div>
            {onDismiss && (
                <button
                    onClick={onDismiss}
                    className="rounded-lg p-1 text-slate-500 hover:bg-slate-200/50 hover:text-slate-800"
                >
                    <X className="h-4 w-4" />
                </button>
            )}
        </div>
    );
}

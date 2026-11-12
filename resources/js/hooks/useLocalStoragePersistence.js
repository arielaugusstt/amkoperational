import { useState, useEffect, useRef } from 'react';

export function useLocalStoragePersistence(menuKey, standId, tanggal, initialValues) {
    const storageKey = `AMK_DRAFT_${menuKey}_${standId || 'none'}_${tanggal || 'none'}`;
    const [formData, setFormData] = useState(initialValues);
    const [restoredBanner, setRestoredBanner] = useState(false);
    const isFirstMount = useRef(true);

    // On standId or tanggal change, attempt to restore from localStorage
    useEffect(() => {
        if (!standId || !tanggal) return;

        const currentKey = `AMK_DRAFT_${menuKey}_${standId}_${tanggal}`;
        const savedDraft = localStorage.getItem(currentKey);

        if (savedDraft) {
            try {
                const parsed = JSON.parse(savedDraft);
                setFormData(parsed);
                setRestoredBanner(true);
            } catch (e) {
                console.error("Gagal parse draft localStorage", e);
            }
        } else {
            setFormData(initialValues);
            setRestoredBanner(false);
        }
    }, [menuKey, standId, tanggal]);

    // Save to localStorage on any form state change
    useEffect(() => {
        if (isFirstMount.current) {
            isFirstMount.current = false;
            return;
        }

        if (standId && tanggal && formData) {
            const currentKey = `AMK_DRAFT_${menuKey}_${standId}_${tanggal}`;
            localStorage.setItem(currentKey, JSON.stringify(formData));
        }
    }, [formData, menuKey, standId, tanggal]);

    const clearDraft = () => {
        if (standId && tanggal) {
            const currentKey = `AMK_DRAFT_${menuKey}_${standId}_${tanggal}`;
            localStorage.removeItem(currentKey);
        }
        setFormData(initialValues);
        setRestoredBanner(false);
    };

    const dismissBanner = () => {
        setRestoredBanner(false);
    };

    return {
        formData,
        setFormData,
        restoredBanner,
        dismissBanner,
        clearDraft,
    };
}

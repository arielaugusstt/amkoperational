import * as XLSX from 'xlsx';

export function downloadTemplate1(stands = [], spgList = []) {
    const wb = XLSX.utils.book_new();

    // Sheet 1: Master_Stand
    const standData = stands.map(s => ({
        Kode_Stand: s.kode_stand,
        Nama_Stand: s.nama_stand,
        Wilayah_Laporan: s.wilayah_laporan,
        Blok_WA: s.blok_wa,
        Urutan_Tampil: s.urutan_tampil,
        Price_Tier: s.price_tier || 'all_outlet',
        Is_Premium: s.is_premium ? 'Ya' : 'Tidak',
        Punya_AMKopi: s.punya_amkopi ? 'Ya' : 'Tidak',
        Tampilkan_Csdng_WA: s.tampilkan_csdng_wa ? 'Ya' : 'Tidak',
        Tampilkan_PTT_WA: s.tampilkan_ptt_wa ? 'Ya' : 'Tidak',
        Status_Aktif: s.status_aktif ? 'Aktif' : 'Non-Aktif',
    }));
    const ws1 = XLSX.utils.json_to_sheet(standData);
    XLSX.utils.book_append_sheet(wb, ws1, 'Master_Stand');

    // Sheet 2: Master_SPG
    const spgData = (spgList && spgList.length > 0)
        ? spgList.map(u => ({
            ID_SPG: u.id_spg || '',
            Nama_SPG: u.name,
            Username_Login: u.username,
            PIN_Default: u.pin_plain || '1234',
            Status_Aktif: u.status_aktif ? 'Aktif' : 'Non-Aktif',
        }))
        : [{
            ID_SPG: 'SPG-01',
            Nama_SPG: 'Contoh Nama SPG',
            Username_Login: 'spg1',
            PIN_Default: '1234',
            Status_Aktif: 'Aktif',
        }];
    const ws2 = XLSX.utils.json_to_sheet(spgData);
    XLSX.utils.book_append_sheet(wb, ws2, 'Master_SPG');

    XLSX.writeFile(wb, 'Template1_Master_Outlet_dan_SPG.xlsx');
}

export function downloadTemplate2(nominals = [], qtys = []) {
    const wb = XLSX.utils.book_new();

    const nomData = nominals.map(n => ({
        Kode_Kategori: n.kode_kategori,
        Label_Input_Nominal: n.label_input_nominal,
        Keterangan_Bantu: n.keterangan_bantu || '',
        Urutan_Tampil: n.urutan,
        Status_Aktif: n.status_aktif ? 'Aktif' : 'Non-Aktif',
    }));
    const ws1 = XLSX.utils.json_to_sheet(nomData);
    XLSX.utils.book_append_sheet(wb, ws1, 'Menu1_Kategori_Nominal');

    const qtyData = qtys.map(q => ({
        Kode_QTY_Menu1: q.kode_qty_menu1,
        Label_Input_QTY: q.label_input_qty,
        Urutan_Tampil: q.urutan,
        Status_Aktif: q.status_aktif ? 'Aktif' : 'Non-Aktif',
    }));
    const ws2 = XLSX.utils.json_to_sheet(qtyData);
    XLSX.utils.book_append_sheet(wb, ws2, 'Menu1_Item_QTY');

    XLSX.writeFile(wb, 'Template2_Konfigurasi_Menu1.xlsx');
}

export function downloadTemplate3(menu2Items = []) {
    const wb = XLSX.utils.book_new();

    const getTier = (item, tier) => {
        const found = (item.prices || []).find(p => p.price_tier === tier);
        return found && found.price !== null ? found.price : '';
    };

    const rows = (menu2Items || []).map(item => ({
        Urutan: item.sort_order,
        Nama_Menu: item.name,
        Kelompok_Menu: item.menu_group,
        Kategori_Laporan: item.report_category,
        Kode_Gelas: item.cup_ingredient?.code || '',
        Harga_All_Outlet: getTier(item, 'all_outlet'),
        Harga_TP1: getTier(item, 'tp1'),
        Harga_PTC: getTier(item, 'ptc'),
        Harga_TP2: getTier(item, 'tp2'),
        Status_Aktif: item.is_active ? 'Aktif' : 'Non-Aktif',
    }));

    const ws = XLSX.utils.json_to_sheet(rows);
    XLSX.utils.book_append_sheet(wb, ws, 'Menu_4Tier_Harga');
    XLSX.writeFile(wb, 'Template3_54_Menu_dan_4Tier_Harga.xlsx');
}

export function downloadTemplate4(ingredients = [], baseRecipes = [], menu2Items = []) {
    const wb = XLSX.utils.book_new();

    // Sheet 1: Master_Bahan_Baku (28 items)
    const ingRows = (ingredients || []).map(ing => ({
        Urutan: ing.display_order,
        Kode_Bahan: ing.code,
        Nama_Bahan_Baku: ing.name,
        Kategori: ing.category,
        Dashboard_Tier: ing.dashboard_tier,
        Satuan_Dasar: ing.base_unit,
        Satuan_Konversi: ing.conversion_unit || '',
        Faktor_Konversi: ing.conversion_factor || '',
        Massa_Jenis: ing.density_g_per_ml || '',
        Catatan: ing.notes || '',
    }));
    const ws1 = XLSX.utils.json_to_sheet(ingRows);
    XLSX.utils.book_append_sheet(wb, ws1, 'Master_Bahan_Baku');

    // Sheet 2: Base_Adonan (7 Base)
    const baseRows = (baseRecipes || []).map(b => ({
        Kode_Base: b.code,
        Nama_Base: b.name,
        Yield_ML: b.yield_ml,
    }));
    const ws2 = XLSX.utils.json_to_sheet(baseRows);
    XLSX.utils.book_append_sheet(wb, ws2, 'Base_Adonan');

    // Sheet 3: Komposisi_Base_Adonan
    const baseCompRows = [];
    (baseRecipes || []).forEach(b => {
        (b.items || []).forEach(it => {
            baseCompRows.push({
                Kode_Base: b.code,
                Tipe_Komponen: it.child_base_recipe ? 'CHILD_BASE' : 'INGREDIENT',
                Kode_Komponen: it.ingredient?.code || it.child_base_recipe?.code || '',
                Nama_Komponen: it.ingredient?.name || it.child_base_recipe?.name || '',
                Takaran: it.quantity,
                Satuan: it.unit,
            });
        });
    });
    const ws3 = XLSX.utils.json_to_sheet(baseCompRows);
    XLSX.utils.book_append_sheet(wb, ws3, 'Komposisi_Base_Adonan');

    // Sheet 4: Formula_Resep_Menu (54 Menus BOM)
    const formulaRows = [];
    (menu2Items || []).forEach(m => {
        (m.recipe_items || []).forEach(ri => {
            formulaRows.push({
                Urutan_Menu: m.sort_order,
                Nama_Menu: m.name,
                Kode_Gelas: m.cup_ingredient?.code || '',
                Tipe_Komponen: ri.base_recipe ? 'BASE_ADONAN' : 'INGREDIENT',
                Kode_Komponen: ri.base_recipe?.code || ri.ingredient?.code || '',
                Nama_Komponen: ri.base_recipe?.name || ri.ingredient?.name || '',
                Takaran: ri.quantity,
                Satuan: ri.input_unit,
            });
        });
    });
    const ws4 = XLSX.utils.json_to_sheet(formulaRows);
    XLSX.utils.book_append_sheet(wb, ws4, 'Formula_Resep_Menu');

    XLSX.writeFile(wb, 'Template4_28_Bahan_7_Base_dan_54_Formula_BOM.xlsx');
}

export function parseExcelFile(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const data = new Uint8Array(e.target.result);
                const workbook = XLSX.read(data, { type: 'array' });
                const result = {};

                workbook.SheetNames.forEach(sheetName => {
                    const ws = workbook.Sheets[sheetName];
                    result[sheetName] = XLSX.utils.sheet_to_json(ws);
                });

                resolve(result);
            } catch (err) {
                reject(err);
            }
        };
        reader.onerror = (err) => reject(err);
        reader.readAsArrayBuffer(file);
    });
}

export function exportComprehensiveReport(summary, standsProgress, tanggal, auditData = []) {
    const wb = XLSX.utils.book_new();

    const rekapData = standsProgress.map(p => ({
        Kode_Stand: p.kode_stand,
        Nama_Stand: p.nama_stand,
        Wilayah: p.wilayah,
        Blok_WA: p.blok_wa,
        Status_Menu1: p.m1_status,
        Total_Penjualan_Menu1: p.m1_total,
        QRIS: p.m1_data ? p.m1_data.nominal_qris : 0,
        Tunai: p.m1_data ? p.m1_data.nominal_tunai : 0,
        Biaya: p.m1_data ? p.m1_data.total_biaya : 0,
        Sisa_Setoran: p.m1_data ? p.m1_data.sisa_setoran_tunai : 0,
        Status_Menu2: p.m2_status,
        Grand_Total_Menu2: p.m2_total,
        Status_Menu3: p.m3_status,
    }));

    const ws1 = XLSX.utils.json_to_sheet(rekapData);
    XLSX.utils.book_append_sheet(wb, ws1, 'Rekap_Operasional');

    if (auditData && auditData.length > 0) {
        const auditRows = auditData.map(a => ({
            Kode_Bahan: a.kode_bahan || a.code,
            Nama_Bahan_Baku: a.nama_bahan_baku || a.name,
            Satuan: a.satuan || a.base_unit,
            Pemakaian_Teoritis_Menu2: a.teoritis ?? a.quantity,
            Pemakaian_Aktual_Menu3: a.aktual,
            Selisih_Aktual_Min_Teoritis: a.selisih,
            Deviasi_Persen: a.deviasi_percent + '%',
            Status_Audit: a.status,
        }));
        const ws2 = XLSX.utils.json_to_sheet(auditRows);
        XLSX.utils.book_append_sheet(wb, ws2, 'Audit_Reverse_Resep');
    }

    XLSX.writeFile(wb, `Laporan_Operasional_AMK_${tanggal}.xlsx`);
}

export function exportAuditReport(auditData, tanggal, standNama = 'Semua Stand') {
    const wb = XLSX.utils.book_new();
    const rows = (auditData || []).map(a => ({
        Kode_Bahan: a.kode_bahan || a.code,
        Nama_Bahan_Baku: a.nama_bahan_baku || a.name,
        Kategori: a.category || '',
        Tier: a.dashboard_tier || '',
        Satuan: a.satuan || a.base_unit,
        Pemakaian_Teoritis_Menu2: a.teoritis ?? a.quantity,
        Konversi_Sekunder: a.converted_quantity ? `${a.converted_quantity} ${a.conversion_unit}` : '-',
        Pemakaian_Aktual_Menu3: a.aktual,
        Selisih: a.selisih,
        Deviasi_Persen: a.deviasi_percent + '%',
        Status_Audit: a.status,
    }));
    const ws = XLSX.utils.json_to_sheet(rows);
    XLSX.utils.book_append_sheet(wb, ws, 'Audit_Reverse_Resep');
    XLSX.writeFile(wb, `Audit_Reverse_Resep_${tanggal}_${standNama.replace(/\s+/g, '_')}.xlsx`);
}

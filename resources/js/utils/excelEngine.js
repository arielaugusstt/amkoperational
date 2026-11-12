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
        Punya_AMKopi: s.punya_amkopi ? 'Ya' : 'Tidak',
        Tampilkan_Csdng_WA: s.tampilkan_csdng_wa ? 'Ya' : 'Tidak',
        Tampilkan_PTT_WA: s.tampilkan_ptt_wa ? 'Ya' : 'Tidak',
        Status_Aktif: s.status_aktif ? 'Ya' : 'Tidak',
    }));
    const ws1 = XLSX.utils.json_to_sheet(standData);
    XLSX.utils.book_append_sheet(wb, ws1, 'Master_Stand');

    // Sheet 2: Master_SPG
    const spgData = spgList.map(u => ({
        ID_SPG: u.id_spg || '',
        Nama_SPG: u.name,
        Username: u.username,
        PIN_Password: u.pin_plain || '1234',
        Status_Aktif: u.status_aktif ? 'Ya' : 'Tidak',
    }));
    const ws2 = XLSX.utils.json_to_sheet(spgData);
    XLSX.utils.book_append_sheet(wb, ws2, 'Master_SPG');

    XLSX.writeFile(wb, 'Master_Stand_dan_SPG.xlsx');
}

export function downloadTemplate2(nominals = [], qtys = []) {
    const wb = XLSX.utils.book_new();

    // Sheet 1: Kategori_Nominal_Menu1
    const nomData = nominals.map(n => ({
        Kode_Kategori: n.kode_kategori,
        Label_Input_Nominal: n.label_input_nominal,
        Urutan: n.urutan,
        Status_Aktif: n.status_aktif ? 'Ya' : 'Tidak',
    }));
    const ws1 = XLSX.utils.json_to_sheet(nomData);
    XLSX.utils.book_append_sheet(wb, ws1, 'Kategori_Nominal_Menu1');

    // Sheet 2: Item_QTY_Menu1
    const qtyData = qtys.map(q => ({
        Kode_QTY_Menu1: q.kode_qty_menu1,
        Label_Input_QTY: q.label_input_qty,
        Urutan: q.urutan,
        Status_Aktif: q.status_aktif ? 'Ya' : 'Tidak',
    }));
    const ws2 = XLSX.utils.json_to_sheet(qtyData);
    XLSX.utils.book_append_sheet(wb, ws2, 'Item_QTY_Menu1');

    XLSX.writeFile(wb, 'Master_Konfigurasi_Menu1.xlsx');
}

export function downloadTemplate3(menu2Items = [], stands = [], prices = {}) {
    const wb = XLSX.utils.book_new();

    const rows = menu2Items.map(item => {
        const row = {
            Kelompok_Menu: item.kelompok_menu,
            Kode_Item: item.kode_item,
            Nama_Item: item.nama_item,
            Status_Aktif: item.status_aktif ? 'Ya' : 'Tidak',
            Harga_Default: item.harga_default,
        };

        const itemPrices = prices[item.id] || [];
        const priceMap = {};
        itemPrices.forEach(p => {
            priceMap[p.stand_id] = p.harga;
        });

        stands.forEach(stand => {
            row[stand.kode_stand] = priceMap[stand.id] !== undefined ? priceMap[stand.id] : item.harga_default;
        });

        return row;
    });

    const ws = XLSX.utils.json_to_sheet(rows);
    XLSX.utils.book_append_sheet(wb, ws, 'Master_Menu2');
    XLSX.writeFile(wb, 'Master_Menu_dan_Harga_Stand_Menu2.xlsx');
}

export function downloadTemplate4(ingredients = [], params = [], batches = [], mappings = [], stands = []) {
    const wb = XLSX.utils.book_new();

    // Sheet 1: Master_Bahan_Menu3
    const ingRows = ingredients.map(ing => {
        const row = {
            Kode_Bahan: ing.kode_bahan,
            Kategori_Bahan: ing.kategori_bahan,
            Nama_Bahan_Baku: ing.nama_bahan_baku,
            Satuan: ing.satuan,
            Link_Kode_QTY_Menu1: ing.link_kode_qty_menu1 || '',
        };
        stands.forEach(s => {
            row[`Stok_Awal_${s.kode_stand}`] = 100;
        });
        return row;
    });
    const ws1 = XLSX.utils.json_to_sheet(ingRows);
    XLSX.utils.book_append_sheet(wb, ws1, 'Master_Bahan_Menu3');

    // Sheet 2: Parameter_Global_Resep
    const paramRows = params.map(p => ({
        Param_Key: p.param_key,
        Nama_Parameter: p.nama_parameter,
        Nilai: p.nilai_param,
        Satuan: p.satuan,
        Effective_Date: p.effective_date,
        Keterangan: p.keterangan || '',
    }));
    const ws2 = XLSX.utils.json_to_sheet(paramRows);
    XLSX.utils.book_append_sheet(wb, ws2, 'Parameter_Global_Resep');

    // Sheet 3: Rumus_Batch_Dapur
    const batchRows = [];
    batches.forEach(b => {
        (b.components || []).forEach(comp => {
            batchRows.push({
                Kode_Batch: b.kode_batch,
                Nama_Batch: b.nama_batch,
                Volume_Batch_ML: b.volume_batch_ml,
                Tipe_Komponen: comp.tipe_komponen,
                Kode_Referensi: comp.kode_referensi,
                Nama_Komponen: comp.nama_komponen,
                Jumlah: comp.jumlah,
                Satuan: comp.satuan,
            });
        });
    });
    const ws3 = XLSX.utils.json_to_sheet(batchRows);
    XLSX.utils.book_append_sheet(wb, ws3, 'Rumus_Batch_Dapur');

    // Sheet 4: Mapping_Resep_Menu2
    const mapRows = mappings.map(m => ({
        Menu2_Item_ID: m.menu2_item_id,
        Tipe_Komponen: m.tipe_komponen,
        Kode_Referensi: m.kode_referensi,
        Mode_Takaran: m.mode_takaran,
        Nilai_Takaran: m.nilai_takaran,
        Satuan: m.satuan,
        Effective_Date: m.effective_date,
    }));
    const ws4 = XLSX.utils.json_to_sheet(mapRows);
    XLSX.utils.book_append_sheet(wb, ws4, 'Mapping_Resep_Menu2');

    XLSX.writeFile(wb, 'Master_Bahan_Baku_dan_Resep_AMK.xlsx');
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

export function exportComprehensiveReport(summary, standsProgress, tanggal) {
    const wb = XLSX.utils.book_new();

    // Sheet 1: Rekap_Harian
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

    XLSX.writeFile(wb, `Laporan_Operasional_AMK_${tanggal}.xlsx`);
}

import ExcelJS from 'exceljs';

function triggerDownload(buffer, filename) {
    const blob = new Blob([buffer], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

function colLetter(colIdx1Based) {
    let temp;
    let letter = '';
    let col = colIdx1Based;
    while (col > 0) {
        temp = (col - 1) % 26;
        letter = String.fromCharCode(temp + 65) + letter;
        col = (col - temp - 1) / 26;
    }
    return letter;
}

const thinBorder = {
    top: { style: 'thin', color: { argb: 'FFD9D9D9' } },
    left: { style: 'thin', color: { argb: 'FFD9D9D9' } },
    bottom: { style: 'thin', color: { argb: 'FFD9D9D9' } },
    right: { style: 'thin', color: { argb: 'FFD9D9D9' } },
};

/**
 * Resolve outlet pivot data by flexible alias code
 */
function findOutletPivot(outletsList, codeAlias) {
    const mapAliases = {
        'R-1': 'R-1',
        'R-2': 'R-2',
        'R-4': 'R-4',
        'trans': 'TRANS',
        'Lippo': 'LIPPO',
        'PA-1': 'PA-1',
        'ITC-UG': 'ITC-UG',
        'BG-L2': 'BG-L2',
        'ITC-FC2': 'ITC-FC2',
        'TP': 'TP-1',
        'TP-1': 'TP-1',
        'AMK PREMIUM': 'TP-2',
        'TP-2': 'TP-2',
        'TP-3': 'TP-3',
        'BG-LL': 'BG-LL',
        'WTC': 'WTC',
        'SUNCITY': 'SNCT',
        'delta': 'Delta',
        'gc': 'GC',
        'GC': 'GC',
        'KAZA': 'KAZA',
        'ptc': 'PTC',
        'PTC': 'PTC',
    };
    const target = (mapAliases[codeAlias] || codeAlias).toLowerCase();
    return (outletsList || []).find(o => (o.kode_stand || '').toLowerCase() === target) || null;
}

/**
 * A. Tombol 1: Export Excel Omzet Bulanan (Format OMS.xlsx / oms okt.xlsx)
 */
export async function exportOmsExcel(biData) {
    const wb = new ExcelJS.Workbook();
    const monthStr = biData?.month || new Date().toISOString().slice(0, 7);
    const calendarDays = biData?.calendar_days || [];
    const outletsList = biData?.pivots?.outlets || [];

    // =========================================================================
    // SHEET 1: Format OMS Presisi (Dual Kode Outlet, Top Summary, Blok 1, PTC, AMKopi)
    // =========================================================================
    const ws = wb.addWorksheet('OMS Bulanan', {
        views: [{ state: 'frozen', xSplit: 2, ySplit: 2 }],
    });

    // Blok 1 exact ordered rows
    const blok1Specs = [
        { label: 'R-1', alias: 'R-1' },
        { label: 'R-2', alias: 'R-2' },
        { label: 'R-4', alias: 'R-4' },
        { label: 'R-5', alias: 'R-5' },
        { label: 'CITO', alias: 'CITO' },
        { label: 'trans', alias: 'trans' },
        { label: 'Lippo', alias: 'Lippo' },
        { label: 'PA-1', alias: 'PA-1' },
        { label: 'ITC-UG', alias: 'ITC-UG' },
        { label: 'BG-L2', alias: 'BG-L2' },
        { label: 'ITC-FC2', alias: 'ITC-FC2' },
        { label: 'TP', alias: 'TP' },
        { label: 'AMK PREMIUM', alias: 'AMK PREMIUM', isCyan: true },
        { label: 'TP-3', alias: 'TP-3' },
        { label: 'BG-LL', alias: 'BG-LL' },
        { label: 'BG-GL', alias: 'BG-GL' },
        { label: 'BG-LG', alias: 'BG-LG' },
        { label: 'WTC', alias: 'WTC' },
        { label: 'SUNCITY', alias: 'SUNCITY' },
        { label: 'RAMAYANA', alias: 'RAMAYANA' },
        { label: 'DTC-L4', alias: 'DTC-L4' },
        { label: 'delta', alias: 'delta' },
        { label: 'gc', alias: 'gc' },
        { label: 'KAZA', alias: 'KAZA' },
    ];

    const amkopiSpecs = [
        { label: 'AMKopi R-1', alias: 'R-1' },
        { label: 'AMKopi R-2', alias: 'R-2' },
        { label: 'AMKopi R-4', alias: 'R-4' },
        { label: 'AMKopi TP-1', alias: 'TP-1' },
        { label: 'AMKopi TP-2', alias: 'TP-2' },
        { label: 'AMKopi TP-3', alias: 'TP-3' },
        { label: 'AMKopi GC', alias: 'GC' },
        { label: 'AMKopi Delta', alias: 'delta' },
        { label: 'AMKopi BG-LL', alias: 'BG-LL' },
        { label: 'AMKopi BG-L2', alias: 'BG-L2' },
    ];

    // Row indices calculation:
    // Row 1: Top Summary Row
    // Row 2: Date Headers 1..31
    // Row 3 .. Row (2 + blok1Specs.length): Blok 1 Outlets (Row 3..26)
    // Row 27: Subtotal Blok 1
    // Row 28: ptc
    // Row 29 .. Row 38: 10 AMKopi Outlets
    // Row 39: Subtotal AMKopi
    // Row 40: Grand Total Bawah
    const blok1StartRow = 3;
    const blok1EndRow = blok1StartRow + blok1Specs.length - 1; // 26
    const subBlok1RowIdx = blok1EndRow + 1; // 27
    const ptcRowIdx = subBlok1RowIdx + 1; // 28
    const amkopiStartRow = ptcRowIdx + 1; // 29
    const amkopiEndRow = amkopiStartRow + amkopiSpecs.length - 1; // 38
    const subAmkopiRowIdx = amkopiEndRow + 1; // 39
    const grandTotalRowIdx = subAmkopiRowIdx + 1; // 40

    // 1. Row 1: Top Summary Row (Background Kuning)
    const row1 = ws.getRow(1);
    row1.getCell(1).value = 'TOTAL HARIAN';
    row1.getCell(2).value = 'ALL';
    for (let d = 1; d <= 31; d++) {
        const col = 2 + d; // C is 3 .. AG is 33
        const cLet = colLetter(col);
        const cell = row1.getCell(col);
        cell.value = { formula: `${cLet}${grandTotalRowIdx}` };
        cell.numFmt = '#,##0';
    }
    row1.getCell(34).value = { formula: 'SUM(C1:AG1)' };
    row1.getCell(34).numFmt = '#,##0';
    row1.getCell(35).value = { formula: 'IFERROR(AVERAGEIF(C1:AG1, ">0"), 0)' };
    row1.getCell(35).numFmt = '#,##0';
    row1.getCell(36).value = 'TOTAL';
    row1.eachCell({ includeEmpty: true }, (cell, colNumber) => {
        if (colNumber <= 36) {
            cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFE699' } };
            cell.font = { bold: true, size: 10 };
            cell.border = thinBorder;
        }
    });

    // 2. Row 2: Header Tanggal 1..31 (Kolom C s/d AG) + AH, AI, AJ
    const row2 = ws.getRow(2);
    row2.getCell(1).value = 'OUTLET';
    row2.getCell(2).value = 'KODE';
    for (let d = 1; d <= 31; d++) {
        const col = 2 + d;
        const dayMeta = calendarDays[d - 1];
        const cell = row2.getCell(col);
        cell.value = d;
        cell.alignment = { horizontal: 'center', vertical: 'middle' };
        cell.font = { bold: true, size: 10, color: { argb: dayMeta?.is_weekend ? 'FF9C0006' : 'FF1F2937' } };
        cell.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: dayMeta?.is_weekend ? 'FFFFC7CE' : 'FFF3F4F6' },
        };
        cell.border = thinBorder;
    }
    row2.getCell(34).value = 'TOTAL';
    row2.getCell(35).value = 'RATA-RATA';
    row2.getCell(36).value = 'OUTLET';
    [1, 2, 34, 35, 36].forEach(c => {
        const cell = row2.getCell(c);
        cell.font = { bold: true, size: 10 };
        cell.alignment = { horizontal: 'center', vertical: 'middle' };
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE5E7EB' } };
        cell.border = thinBorder;
    });

    // Helper to populate an outlet row
    const writeOutletRow = (rIdx, label, pivotObj, valueType = 'amk_non_kopi', rowFillArgb = null) => {
        const r = ws.getRow(rIdx);
        r.getCell(1).value = label;
        r.getCell(2).value = label;
        r.getCell(1).font = { bold: true, size: 10 };
        r.getCell(2).font = { bold: true, size: 10 };

        for (let d = 1; d <= 31; d++) {
            const col = 2 + d;
            const dayData = pivotObj?.days?.[d];
            let val = 0;
            if (dayData) {
                if (valueType === 'amkopi') {
                    val = Number(dayData.omzet_amkopi || 0);
                } else {
                    // Main AMK stand omzet (excluding separate AMKopi row so Grand Total doesn't double count AMKopi)
                    val = Number((dayData.omzet_total || 0) - (dayData.omzet_amkopi || 0));
                }
            }
            const cell = r.getCell(col);
            cell.value = val;
            cell.numFmt = '#,##0;-#,##0;"-"';
        }

        // Kolom AH (34): TOTAL
        r.getCell(34).value = { formula: `SUM(C${rIdx}:AG${rIdx})` };
        r.getCell(34).numFmt = '#,##0;-#,##0;"-"';
        r.getCell(34).font = { bold: true, size: 10 };

        // Kolom AI (35): RATA-RATA
        r.getCell(35).value = { formula: `IFERROR(AVERAGEIF(C${rIdx}:AG${rIdx}, ">0"), 0)` };
        r.getCell(35).numFmt = '#,##0;-#,##0;"-"';

        // Kolom AJ (36): Kode Outlet ulang
        r.getCell(36).value = label;
        r.getCell(36).font = { bold: true, size: 10 };

        for (let c = 1; c <= 36; c++) {
            const cell = r.getCell(c);
            cell.border = thinBorder;
            const dayMeta = (c >= 3 && c <= 33) ? calendarDays[c - 3] : null;
            if (rowFillArgb) {
                cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: rowFillArgb } };
            } else if (dayMeta?.is_weekend) {
                cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFF1F2' } };
            }
        }
    };

    // 3. Write Blok 1 Rows
    blok1Specs.forEach((spec, idx) => {
        const rIdx = blok1StartRow + idx;
        const pivotObj = findOutletPivot(outletsList, spec.alias);
        writeOutletRow(rIdx, spec.label, pivotObj, 'amk_non_kopi', spec.isCyan ? 'FFCCECFF' : null);
    });

    // 4. Write Subtotal Blok 1 Row
    const rSub1 = ws.getRow(subBlok1RowIdx);
    rSub1.getCell(1).value = 'SUBTOTAL BLOK 1';
    rSub1.getCell(2).value = 'SUB BLOK 1';
    for (let d = 1; d <= 31; d++) {
        const col = 2 + d;
        const cLet = colLetter(col);
        const cell = rSub1.getCell(col);
        cell.value = { formula: `SUM(${cLet}${blok1StartRow}:${cLet}${blok1EndRow})` };
        cell.numFmt = '#,##0';
    }
    rSub1.getCell(34).value = { formula: `SUM(C${subBlok1RowIdx}:AG${subBlok1RowIdx})` };
    rSub1.getCell(34).numFmt = '#,##0';
    rSub1.getCell(35).value = { formula: `IFERROR(AVERAGEIF(C${subBlok1RowIdx}:AG${subBlok1RowIdx}, ">0"), 0)` };
    rSub1.getCell(35).numFmt = '#,##0';
    rSub1.getCell(36).value = 'SUB BLOK 1';
    for (let c = 1; c <= 36; c++) {
        const cell = rSub1.getCell(c);
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFD9E1F2' } };
        cell.font = { bold: true, size: 10 };
        cell.border = thinBorder;
    }

    // 5. Write Mandiri Row: ptc
    const ptcObj = findOutletPivot(outletsList, 'ptc');
    writeOutletRow(ptcRowIdx, 'ptc', ptcObj, 'amk_non_kopi', null);

    // 6. Write Blok 2: 10 AMKopi Rows
    amkopiSpecs.forEach((spec, idx) => {
        const rIdx = amkopiStartRow + idx;
        const pivotObj = findOutletPivot(outletsList, spec.alias);
        writeOutletRow(rIdx, spec.label, pivotObj, 'amkopi', null);
    });

    // 7. Write Subtotal AMKopi Row (Background Oranye Muda)
    const rSubKopi = ws.getRow(subAmkopiRowIdx);
    rSubKopi.getCell(1).value = 'SUBTOTAL AMKOPI';
    rSubKopi.getCell(2).value = 'SUB AMKOPI';
    for (let d = 1; d <= 31; d++) {
        const col = 2 + d;
        const cLet = colLetter(col);
        const cell = rSubKopi.getCell(col);
        cell.value = { formula: `SUM(${cLet}${amkopiStartRow}:${cLet}${amkopiEndRow})` };
        cell.numFmt = '#,##0';
    }
    rSubKopi.getCell(34).value = { formula: `SUM(C${subAmkopiRowIdx}:AG${subAmkopiRowIdx})` };
    rSubKopi.getCell(34).numFmt = '#,##0';
    rSubKopi.getCell(35).value = { formula: `IFERROR(AVERAGEIF(C${subAmkopiRowIdx}:AG${subAmkopiRowIdx}, ">0"), 0)` };
    rSubKopi.getCell(35).numFmt = '#,##0';
    rSubKopi.getCell(36).value = 'SUB AMKOPI';
    for (let c = 1; c <= 36; c++) {
        const cell = rSubKopi.getCell(c);
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFCE4D6' } };
        cell.font = { bold: true, size: 10 };
        cell.border = thinBorder;
    }

    // 8. Write Grand Total Bawah Row (Background Kuning)
    const rGrand = ws.getRow(grandTotalRowIdx);
    rGrand.getCell(1).value = 'GRAND TOTAL';
    rGrand.getCell(2).value = 'TOTAL ALL';
    for (let d = 1; d <= 31; d++) {
        const col = 2 + d;
        const cLet = colLetter(col);
        const cell = rGrand.getCell(col);
        cell.value = { formula: `${cLet}${subBlok1RowIdx}+${cLet}${ptcRowIdx}+${cLet}${subAmkopiRowIdx}` };
        cell.numFmt = '#,##0';
    }
    rGrand.getCell(34).value = { formula: `SUM(C${grandTotalRowIdx}:AG${grandTotalRowIdx})` };
    rGrand.getCell(34).numFmt = '#,##0';
    rGrand.getCell(35).value = { formula: `IFERROR(AVERAGEIF(C${grandTotalRowIdx}:AG${grandTotalRowIdx}, ">0"), 0)` };
    rGrand.getCell(35).numFmt = '#,##0';
    rGrand.getCell(36).value = 'GRAND TOTAL';
    for (let c = 1; c <= 36; c++) {
        const cell = rGrand.getCell(c);
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFE699' } };
        cell.font = { bold: true, size: 10 };
        cell.border = thinBorder;
    }

    // Set column widths
    ws.getColumn(1).width = 18;
    ws.getColumn(2).width = 16;
    for (let c = 3; c <= 33; c++) {
        ws.getColumn(c).width = 13;
    }
    ws.getColumn(34).width = 16;
    ws.getColumn(35).width = 15;
    ws.getColumn(36).width = 16;

    const buffer = await wb.xlsx.writeBuffer();
    triggerDownload(buffer, `oms_${monthStr}.xlsx`);
}

/**
 * B. Tombol 2: Export Excel Presensi & Omzet SPG (Format PRES.xlsx / pres okt.xlsx)
 */
export async function exportPresExcel(biData) {
    const wb = new ExcelJS.Workbook();
    const monthStr = biData?.month || new Date().toISOString().slice(0, 7);
    const daysInMonth = biData?.days_in_month || 31;
    const calendarDays = biData?.calendar_days || [];
    const spgList = biData?.pivots?.spg || [];

    // =========================================================================
    // SHEET 1: Struktur 2 Baris Bertumpuk per SPG (Stacked Rows Matrix)
    // =========================================================================
    const ws = wb.addWorksheet('Presensi & Omzet SPG', {
        views: [{ state: 'frozen', xSplit: 2, ySplit: 3 }],
    });

    // Title Row 1
    ws.mergeCells('A1:AK1');
    const titleCell = ws.getCell('A1');
    titleCell.value = `MATRIKS PRESENSI JADWAL & OMZET HARIAN SPG — PERIODE ${monthStr}`;
    titleCell.font = { bold: true, size: 12 };

    // Header Row 3
    const hRow = ws.getRow(3);
    hRow.getCell(1).value = 'NO';
    hRow.getCell(2).value = 'NAMA SPG';
    for (let d = 1; d <= 31; d++) {
        const col = 2 + d;
        const dayMeta = calendarDays[d - 1];
        const cell = hRow.getCell(col);
        cell.value = d;
        cell.alignment = { horizontal: 'center', vertical: 'middle' };
        cell.font = { bold: true, size: 10, color: { argb: dayMeta?.is_weekend ? 'FF9C0006' : 'FF1F2937' } };
        cell.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: dayMeta?.is_weekend ? 'FFFFC7CE' : 'FFE5E7EB' },
        };
        cell.border = thinBorder;
    }
    hRow.getCell(34).value = 'TOTAL MASUK';
    hRow.getCell(35).value = 'TOTAL OFF';
    hRow.getCell(36).value = 'TOTAL OMZET';
    hRow.getCell(37).value = 'RATA-RATA / SHIFT';
    [1, 2, 34, 35, 36, 37].forEach(c => {
        const cell = hRow.getCell(c);
        cell.font = { bold: true, size: 10 };
        cell.alignment = { horizontal: 'center', vertical: 'middle' };
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFD9E1F2' } };
        cell.border = thinBorder;
    });

    let currentRow = 4;
    const topRowIndices = [];
    const bottomRowIndices = [];

    spgList.forEach((spg, idx) => {
        const rTopIdx = currentRow;
        const rBotIdx = currentRow + 1;
        topRowIndices.push(rTopIdx);
        bottomRowIndices.push(rBotIdx);

        const rTop = ws.getRow(rTopIdx);
        const rBot = ws.getRow(rBotIdx);

        rTop.getCell(1).value = idx + 1;
        rTop.getCell(2).value = spg.name;

        for (let d = 1; d <= 31; d++) {
            const col = 2 + d;
            const dInfo = spg.days?.[d];
            const standCode = dInfo?.stand_code || '';
            const omzetVal = Number(dInfo?.omzet || 0);

            const cTop = rTop.getCell(col);
            cTop.value = standCode ? standCode : null;
            cTop.alignment = { horizontal: 'center', vertical: 'middle' };
            cTop.font = { bold: true, size: 9, color: { argb: 'FF1E3A8A' } };
            cTop.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF8FAFC' } };
            cTop.border = thinBorder;

            const cBot = rBot.getCell(col);
            cBot.value = standCode ? omzetVal : null;
            cBot.numFmt = '#,##0';
            cBot.alignment = { horizontal: 'right', vertical: 'middle' };
            cBot.font = { size: 9 };
            cBot.border = thinBorder;
        }

        // Formulas in columns AH(34), AI(35), AJ(36), AK(37)
        rTop.getCell(34).value = { formula: `COUNTA(C${rTopIdx}:AG${rTopIdx})` };
        rTop.getCell(34).alignment = { horizontal: 'center', vertical: 'middle' };
        rTop.getCell(34).font = { bold: true, size: 10 };

        rTop.getCell(35).value = { formula: `${daysInMonth}-AH${rTopIdx}` };
        rTop.getCell(35).alignment = { horizontal: 'center', vertical: 'middle' };
        rTop.getCell(35).font = { bold: true, size: 10 };

        rTop.getCell(36).value = { formula: `SUM(C${rBotIdx}:AG${rBotIdx})` };
        rTop.getCell(36).numFmt = '#,##0';
        rTop.getCell(36).alignment = { horizontal: 'right', vertical: 'middle' };
        rTop.getCell(36).font = { bold: true, size: 10 };

        rTop.getCell(37).value = { formula: `IFERROR(AJ${rTopIdx}/AH${rTopIdx}, 0)` };
        rTop.getCell(37).numFmt = '#,##0';
        rTop.getCell(37).alignment = { horizontal: 'right', vertical: 'middle' };
        rTop.getCell(37).font = { bold: true, size: 10 };

        // Vertical merges: NO (A), NAMA SPG (B), TOTAL MASUK (AH), TOTAL OFF (AI), TOTAL OMZET (AJ), RATA-RATA (AK)
        ws.mergeCells(`A${rTopIdx}:A${rBotIdx}`);
        ws.mergeCells(`B${rTopIdx}:B${rBotIdx}`);
        ws.mergeCells(`AH${rTopIdx}:AH${rBotIdx}`);
        ws.mergeCells(`AI${rTopIdx}:AI${rBotIdx}`);
        ws.mergeCells(`AJ${rTopIdx}:AJ${rBotIdx}`);
        ws.mergeCells(`AK${rTopIdx}:AK${rBotIdx}`);

        [1, 2, 34, 35, 36, 37].forEach(c => {
            rTop.getCell(c).border = thinBorder;
            rBot.getCell(c).border = thinBorder;
            if (c === 1) rTop.getCell(c).alignment = { horizontal: 'center', vertical: 'middle' };
            if (c === 2) {
                rTop.getCell(c).alignment = { horizontal: 'left', vertical: 'middle' };
                rTop.getCell(c).font = { bold: true, size: 10 };
            }
        });

        currentRow += 2;
    });

    // Footer Rows: TOTAL SPG MASUK / HARI & TOTAL OMZET / HARI
    const fRow1Idx = currentRow;
    const fRow2Idx = currentRow + 1;
    const fRow1 = ws.getRow(fRow1Idx);
    const fRow2 = ws.getRow(fRow2Idx);

    fRow1.getCell(2).value = 'TOTAL SPG MASUK / HARI';
    fRow2.getCell(2).value = 'TOTAL OMZET / HARI';

    for (let d = 1; d <= 31; d++) {
        const col = 2 + d;
        const cLet = colLetter(col);
        if (topRowIndices.length > 0) {
            const topCells = topRowIndices.map(r => `${cLet}${r}`).join(',');
            const botCells = bottomRowIndices.map(r => `${cLet}${r}`).join('+');
            fRow1.getCell(col).value = { formula: `COUNTA(${topCells})` };
            fRow2.getCell(col).value = { formula: botCells };
        } else {
            fRow1.getCell(col).value = 0;
            fRow2.getCell(col).value = 0;
        }
        fRow1.getCell(col).alignment = { horizontal: 'center' };
        fRow2.getCell(col).numFmt = '#,##0';
    }

    for (let c = 1; c <= 37; c++) {
        fRow1.getCell(c).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFD9E1F2' } };
        fRow1.getCell(c).font = { bold: true, size: 10 };
        fRow1.getCell(c).border = thinBorder;

        fRow2.getCell(c).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFE699' } };
        fRow2.getCell(c).font = { bold: true, size: 10 };
        fRow2.getCell(c).border = thinBorder;
    }

    ws.getColumn(1).width = 6;
    ws.getColumn(2).width = 22;
    for (let c = 3; c <= 33; c++) {
        ws.getColumn(c).width = 13;
    }
    ws.getColumn(34).width = 14;
    ws.getColumn(35).width = 12;
    ws.getColumn(36).width = 16;
    ws.getColumn(37).width = 18;

    // =========================================================================
    // SHEET 2: Matriks Jadwal Tanggal (1..31) x Nama SPG (Format Grid Presensi)
    // =========================================================================
    const ws2 = wb.addWorksheet('Matriks Jadwal Harian', {
        views: [{ state: 'frozen', xSplit: 1, ySplit: 1 }],
    });
    const h2 = ws2.getRow(1);
    h2.getCell(1).value = 'TGL';
    spgList.forEach((spg, idx) => {
        const cell = h2.getCell(2 + idx);
        cell.value = spg.name;
        cell.font = { bold: true, size: 10 };
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE5E7EB' } };
        cell.border = thinBorder;
    });
    for (let d = 1; d <= 31; d++) {
        const r = ws2.getRow(1 + d);
        r.getCell(1).value = d;
        r.getCell(1).font = { bold: true };
        r.getCell(1).border = thinBorder;
        spgList.forEach((spg, idx) => {
            const cell = r.getCell(2 + idx);
            cell.value = spg.days?.[d]?.stand_code || '';
            cell.alignment = { horizontal: 'center' };
            cell.border = thinBorder;
        });
    }

    const buffer = await wb.xlsx.writeBuffer();
    triggerDownload(buffer, `pres_${monthStr}.xlsx`);
}

/**
 * C. Tombol 3: Export Excel Pivot Aktif (Cup 12oz / 22oz / 16oz / AMKopi / QRIS / Biaya)
 */
export async function exportActivePivotExcel(biData, activeTab, liniFilter = 'all') {
    if (activeTab === 'spg_schedule') {
        return exportPresExcel(biData);
    }

    const wb = new ExcelJS.Workbook();
    const monthStr = biData?.month || new Date().toISOString().slice(0, 7);
    const calendarDays = biData?.calendar_days || [];
    const outletsList = biData?.pivots?.outlets || [];

    const tabTitles = {
        omzet: `Pivot Omzet (${liniFilter.toUpperCase()})`,
        cup_12: 'Pivot Cup 12 oz (AMK)',
        cup_22: 'Pivot Cup 22 oz (AMK)',
        cup_16: 'Pivot Cup 16 oz (AMK)',
        cup_kopi: 'Pivot Cup 12 oz AMKopi',
        qris_tunai: 'Pivot QRIS & Setoran Tunai',
        biaya: 'Pivot Biaya Operasional',
    };
    const sheetTitle = tabTitles[activeTab] || 'Pivot Aktif';

    const ws = wb.addWorksheet(sheetTitle.slice(0, 31), {
        views: [{ state: 'frozen', xSplit: 3, ySplit: 2 }],
    });

    ws.mergeCells('A1:AE1');
    ws.getCell('A1').value = `${sheetTitle.toUpperCase()} — PERIODE ${monthStr}`;
    ws.getCell('A1').font = { bold: true, size: 12 };

    const hRow = ws.getRow(2);
    hRow.getCell(1).value = '#';
    hRow.getCell(2).value = 'KODE & NAMA OUTLET';
    hRow.getCell(3).value = 'TOTAL BULANAN';

    for (let d = 1; d <= 31; d++) {
        const col = 3 + d;
        const dayMeta = calendarDays[d - 1];
        const cell = hRow.getCell(col);
        cell.value = `${d} (${dayMeta?.day_name || ''})`;
        cell.alignment = { horizontal: 'center' };
        cell.font = { bold: true, size: 9, color: { argb: dayMeta?.is_weekend ? 'FF9C0006' : 'FF1F2937' } };
        cell.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: dayMeta?.is_weekend ? 'FFFFC7CE' : 'FFE5E7EB' },
        };
        cell.border = thinBorder;
    }

    [1, 2, 3].forEach(c => {
        hRow.getCell(c).font = { bold: true, size: 10 };
        hRow.getCell(c).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFD9E1F2' } };
        hRow.getCell(c).border = thinBorder;
    });

    const pickValue = (obj) => {
        if (!obj) return 0;
        if (activeTab === 'omzet') {
            if (liniFilter === 'amk_murni') return obj.omzet_amk_murni || 0;
            if (liniFilter === 'amkopi') return obj.omzet_amkopi || 0;
            if (liniFilter === 'kurma') return obj.omzet_kurma || 0;
            if (liniFilter === 'ptt') return obj.omzet_ptt || 0;
            if (liniFilter === 'mineral') return obj.omzet_mineral || 0;
            return obj.omzet_total || 0;
        }
        if (activeTab === 'cup_12') return obj.cup_12_amk || 0;
        if (activeTab === 'cup_22') return obj.cup_22_amk || 0;
        if (activeTab === 'cup_16') return obj.cup_16_amk || 0;
        if (activeTab === 'cup_kopi') return obj.cup_amkopi || 0;
        if (activeTab === 'qris_tunai') return obj.qris || 0;
        if (activeTab === 'biaya') return obj.total_biaya || 0;
        return 0;
    };

    outletsList.forEach((st, idx) => {
        const rIdx = 3 + idx;
        const r = ws.getRow(rIdx);
        r.getCell(1).value = idx + 1;
        r.getCell(2).value = `${st.kode_stand} - ${st.nama_stand}`;
        r.getCell(2).font = { bold: true, size: 10 };
        r.getCell(3).value = { formula: `SUM(D${rIdx}:AH${rIdx})` };
        r.getCell(3).numFmt = '#,##0';
        r.getCell(3).font = { bold: true, size: 10 };

        for (let d = 1; d <= 31; d++) {
            const col = 3 + d;
            const cell = r.getCell(col);
            cell.value = Number(pickValue(st.days?.[d]) || 0);
            cell.numFmt = '#,##0;-#,##0;"-"';
            cell.border = thinBorder;
        }
        [1, 2, 3].forEach(c => {
            r.getCell(c).border = thinBorder;
        });
    });

    // Bottom Total Row
    const totRowIdx = 3 + outletsList.length;
    const totRow = ws.getRow(totRowIdx);
    totRow.getCell(2).value = 'TOTAL KESELURUHAN';
    totRow.getCell(3).value = { formula: `SUM(C3:C${totRowIdx - 1})` };
    totRow.getCell(3).numFmt = '#,##0';

    for (let d = 1; d <= 31; d++) {
        const col = 3 + d;
        const cLet = colLetter(col);
        totRow.getCell(col).value = outletsList.length > 0
            ? { formula: `SUM(${cLet}3:${cLet}${totRowIdx - 1})` }
            : 0;
        totRow.getCell(col).numFmt = '#,##0';
    }
    for (let c = 1; c <= 34; c++) {
        totRow.getCell(c).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFE699' } };
        totRow.getCell(c).font = { bold: true, size: 10 };
        totRow.getCell(c).border = thinBorder;
    }

    ws.getColumn(1).width = 5;
    ws.getColumn(2).width = 26;
    ws.getColumn(3).width = 16;
    for (let c = 4; c <= 34; c++) {
        ws.getColumn(c).width = 13;
    }

    const buffer = await wb.xlsx.writeBuffer();
    triggerDownload(buffer, `Pivot_${activeTab}_${monthStr}.xlsx`);
}

export function openPrintReportModal(allRecords, branchesList, currentUser, currentBranchFilter, monthFilterSelect, currentMonth, formatThaiDate, formatMonthTitle) {
    let monthSelectOptions = {};
    for (let opt of monthFilterSelect.options) {
        if (opt.value !== 'all') {
            monthSelectOptions[opt.value] = opt.text;
        }
    }

    if (Object.keys(monthSelectOptions).length === 0) {
        Swal.fire('แจ้งเตือน', 'ยังไม่มีข้อมูลเดือนที่มีงานในระบบ', 'warning');
        return;
    }

    Swal.fire({
        title: '🖨️ เลือกเดือนที่ต้องการพิมพ์รายงาน',
        input: 'select',
        inputOptions: monthSelectOptions,
        inputValue: currentMonth !== 'all' ? currentMonth : Object.keys(monthSelectOptions)[0],
        showCancelButton: true,
        confirmButtonText: 'พิมพ์รายงาน',
        cancelButtonText: 'ยกเลิก',
        confirmButtonColor: '#059669'
    }).then((result) => {
        if (result.value) {
            generateReportWindow(result.value, allRecords, branchesList, currentUser, currentBranchFilter, formatThaiDate, formatMonthTitle);
        }
    });
}

function generateReportWindow(targetMonth, allRecords, branchesList, currentUser, currentBranchFilter, formatThaiDate, formatMonthTitle) {
    let recordsToPrint = allRecords.filter(r => {
        let matchMonth = r.completed_date && r.completed_date.startsWith(targetMonth);
        let matchBranch = currentUser.role === 'staff' ? r.branch_id === currentUser.branch_id : (currentBranchFilter === 'all' || r.branch_id === currentBranchFilter);
        let isCompleted = r.status?.operation === 'เสร็จแล้ว';
        return matchMonth && matchBranch && isCompleted;
    });

    if (recordsToPrint.length === 0) {
        Swal.fire('แจ้งเตือน', 'ไม่พบข้อมูลงานที่เสร็จสิ้นในเดือนที่เลือกสำหรับออกรายงาน', 'warning');
        return;
    }

    let totalColl = 0, totalProf = 0;
    recordsToPrint.forEach(r => {
        totalColl += r.financial?.total_collected || 0;
        totalProf += r.financial?.remaining_balance || 0;
    });

    let monthDisplayName = formatMonthTitle(targetMonth);
    let branchDisplayName = currentUser.role === 'staff' ? currentUser.branchName : (currentBranchFilter === 'all' ? 'ทุกสาขา' : branchesList.find(b => b.id === currentBranchFilter)?.name || '-');

    let rowsHtml = '';
    recordsToPrint.forEach((r, index) => {
        let branchObj = branchesList.find(b => b.id === r.branch_id);
        let bName = branchObj ? branchObj.name : '-';
        rowsHtml += `
            <tr>
                <td style="border: 1px solid #ddd; padding: 6px; text-align: center;">${index + 1}</td>
                <td style="border: 1px solid #ddd; padding: 6px; white-space: nowrap;">${formatThaiDate(r.completed_date)}</td>
                ${currentUser.role === 'admin' && currentBranchFilter === 'all' ? `<td style="border: 1px solid #ddd; padding: 6px;">${bName}</td>` : ''}
                <td style="border: 1px solid #ddd; padding: 6px; font-weight: bold;">${r.old_plate || '-'} <span style="font-size:11px; font-weight:normal; color:#555;">(${r.old_province || ''})</span></td>
                <td style="border: 1px solid #ddd; padding: 6px; font-weight: bold; color: #6b21a8;">${r.new_plate ? r.new_plate + ' <span style="font-size:11px; font-weight:normal; color:#555;">(' + (r.new_province || '') + ')</span>' : '-'}</td>
                <td style="border: 1px solid #ddd; padding: 6px;">${r.car_model || '-'} <br><span style="font-size:11px; color:#2563eb;">(${r.service_type || '-'})</span></td>
                <td style="border: 1px solid #ddd; padding: 6px; text-align: right; white-space: nowrap;">฿${(r.financial?.total_collected || 0).toLocaleString()}</td>
                <td style="border: 1px solid #ddd; padding: 6px; text-align: right; color: #16a34a; font-weight: bold; white-space: nowrap;">฿${(r.financial?.remaining_balance || 0).toLocaleString()}</td>
            </tr>
        `;
    });

    let printWindow = window.open('', '_blank');
    printWindow.document.write(`
        <!DOCTYPE html>
        <html lang="th">
        <head>
            <meta charset="UTF-8">
            <title>รายงานสรุปผลการดำเนินงาน ประจำเดือน ${monthDisplayName}</title>
            <link href="https://fonts.googleapis.com/css2?family=Noto+Sans+Thai:wght@300;400;500;600;700&display=swap" rel="stylesheet">
            <style>
                body { font-family: 'Noto Sans Thai', sans-serif; padding: 25px; color: #333; }
                h2 { margin: 0 0 5px 0; text-align: center; font-size: 20px; }
                h4 { margin: 0 0 15px 0; text-align: center; font-size: 14px; color: #555; font-weight: normal; }
                .header-info { margin-bottom: 15px; font-size: 13px; display: flex; justify-content: space-between; border-bottom: 2px solid #ddd; padding-bottom: 8px; }
                table { width: 100%; border-collapse: collapse; margin-top: 10px; font-size: 12px; }
                th { background-color: #f3f4f6; border: 1px solid #ddd; padding: 8px; text-align: left; }
                .summary-box { margin-top: 20px; border: 1px solid #ddd; padding: 15px; border-radius: 8px; background: #f9fafb; display: flex; justify-content: space-around; font-size: 14px; font-weight: bold; }
                @media print {
                    body { padding: 0; }
                    button { display: none; }
                }
            </style>
        </head>
        <body>
            <h2>🚗 รายงานสรุปผลการดำเนินงาน ตรอ. และทะเบียนรถ</h2>
            <h4>ประจำเดือน: ${monthDisplayName} | สาขา: ${branchDisplayName}</h4>
            <div class="header-info">
                <span>วันที่พิมพ์รายงาน: ${formatThaiDate(new Date().toISOString().split('T')[0])}</span>
                <span>ผู้พิมพ์: ${currentUser.username}</span>
            </div>
            <table>
                <thead>
                    <tr>
                        <th style="width: 40px; text-align: center;">ลำดับ</th>
                        <th>วันที่เสร็จ</th>
                        ${currentUser.role === 'admin' && currentBranchFilter === 'all' ? `<th>สาขา</th>` : ''}
                        <th>ทะเบียนเก่า</th>
                        <th>ทะเบียนใหม่</th>
                        <th>รุ่นรถ / บริการ</th>
                        <th style="text-align: right;">ยอดเก็บ (บาท)</th>
                        <th style="text-align: right;">กำไรสุทธิ (บาท)</th>
                    </tr>
                </thead>
                <tbody>
                    ${rowsHtml}
                </tbody>
            </table>
            <div class="summary-box">
                <div>จำนวนงานเสร็จสิ้น: ${recordsToPrint.length} รายการ</div>
                <div>ยอดเงินเก็บรวม: ฿${totalColl.toLocaleString()}</div>
                <div style="color: #16a34a;">กำไรสุทธิรวม: ฿${totalProf.toLocaleString()}</div>
            </div>
            <script>
                window.onload = function() { window.print(); }
            </script>
        </body>
        </html>
    `);
    printWindow.document.close();
}

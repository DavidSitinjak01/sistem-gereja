import { db } from '@/lib/db';
import { ensureDbSetup } from '@/lib/db-setup';
import { NextRequest, NextResponse } from 'next/server';
import * as XLSX from 'xlsx';

const MARITAL_LABEL: Record<string, string> = {
  'MENIKAH': 'Menikah',
  'BELUM MENIKAH': 'Belum Menikah',
  'MUDA-MUDI': 'Muda-mudi',
  'REMAJA': 'Remaja',
  'SEKOLAH MINGGU': 'Sekolah Minggu',
};

export async function GET(request: NextRequest) {
  try {
    await ensureDbSetup();

    const format = request.nextUrl.searchParams.get('format') || 'excel';
    const searchQuery = request.nextUrl.searchParams.get('search');

    const members = await db.member.findMany({
      where: searchQuery
        ? {
            OR: [
              { name: { contains: searchQuery } },
              { occupation: { contains: searchQuery } },
              { phone: { contains: searchQuery } },
              { address: { contains: searchQuery } },
            ],
          }
        : undefined,
      orderBy: { name: 'asc' },
    });

    // Fetch church settings for header
    const settings = await db.churchSetting.findUnique({ where: { id: 'default' } });
    const churchName = settings?.churchName || 'Gereja';
    const churchAddress = [settings?.village, settings?.district, settings?.regency, settings?.province]
      .filter(Boolean).join(', ');

    if (format === 'excel') {
      return generateExcel(members, churchName);
    }

    if (format === 'pdf') {
      return generatePdfHtml(members, churchName, churchAddress);
    }

    return NextResponse.json({ error: 'Format tidak didukung' }, { status: 400 });
  } catch (error) {
    console.error('Failed to export members:', error);
    return NextResponse.json(
      { error: 'Gagal mengekspor data jemaat' },
      { status: 500 }
    );
  }
}

function generateExcel(members: Array<{
  id: string;
  name: string;
  gender: string | null;
  occupation: string | null;
  phone: string | null;
  address: string | null;
  maritalStatus: string | null;
  membershipStatus: string;
}>, churchName: string) {
  const data = members.map((m, i) => ({
    'No': i + 1,
    'Nama': m.name,
    'Jenis Kelamin': m.gender === 'LAKI-LAKI' ? 'Laki-laki' : m.gender === 'PEREMPUAN' ? 'Perempuan' : '-',
    'Pekerjaan': m.occupation || '-',
    'No Hp/WA': m.phone || '-',
    'Alamat': m.address || '-',
    'Status Pernikahan': m.maritalStatus ? (MARITAL_LABEL[m.maritalStatus] || m.maritalStatus) : '-',
    'Status': m.membershipStatus,
  }));

  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.json_to_sheet(data);

  // Set column widths
  ws['!cols'] = [
    { wch: 5 },   // No
    { wch: 25 },  // Nama
    { wch: 15 },  // Jenis Kelamin
    { wch: 18 },  // Pekerjaan
    { wch: 18 },  // No Hp/WA
    { wch: 30 },  // Alamat
    { wch: 18 },  // Status Pernikahan
    { wch: 12 },  // Status
  ];

  XLSX.utils.book_append_sheet(wb, ws, 'Data Jemaat');

  const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });

  return new NextResponse(buffer, {
    status: 200,
    headers: {
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': `attachment; filename="Data_Jemaat_${churchName.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.xlsx"`,
    },
  });
}

function generatePdfHtml(
  members: Array<{
    id: string;
    name: string;
    gender: string | null;
    occupation: string | null;
    phone: string | null;
    address: string | null;
    maritalStatus: string | null;
    membershipStatus: string;
  }>,
  churchName: string,
  churchAddress: string
) {
  const printDate = new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });

  const rows = members.map((m, i) => `
    <tr>
      <td style="text-align:center;">${i + 1}</td>
      <td>${m.name}</td>
      <td style="text-align:center;">${m.gender === 'LAKI-LAKI' ? 'L' : m.gender === 'PEREMPUAN' ? 'P' : '-'}</td>
      <td>${m.occupation || '-'}</td>
      <td style="text-align:center;">${m.phone || '-'}</td>
      <td>${m.address || '-'}</td>
      <td style="text-align:center;">${m.maritalStatus ? (MARITAL_LABEL[m.maritalStatus] || m.maritalStatus) : '-'}</td>
      <td style="text-align:center;">${m.membershipStatus}</td>
    </tr>
  `).join('');

  const html = `<!DOCTYPE html>
<html>
<head>
  <title>Data Jemaat ${churchName}</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
      color: #1a1a1a;
      padding: 30px;
      font-size: 9pt;
      line-height: 1.4;
    }
    .header {
      text-align: center;
      border-bottom: 3px double #92400e;
      padding-bottom: 12px;
      margin-bottom: 16px;
    }
    .church-name {
      font-size: 16pt;
      font-weight: 700;
      color: #78350f;
      letter-spacing: 1px;
    }
    .church-address {
      font-size: 9pt;
      color: #92400e;
      margin-top: 2px;
    }
    .report-title {
      font-size: 12pt;
      font-weight: 600;
      margin-top: 10px;
      color: #1a1a1a;
    }
    .report-date {
      font-size: 9pt;
      color: #57534e;
      margin-top: 2px;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin-top: 12px;
      font-size: 8.5pt;
    }
    th {
      background: #fffbeb;
      padding: 6px 8px;
      text-align: left;
      font-weight: 600;
      font-size: 8pt;
      color: #92400e;
      text-transform: uppercase;
      letter-spacing: 0.3px;
      border-bottom: 2px solid #fbbf24;
    }
    td {
      padding: 5px 8px;
      border-bottom: 1px solid #f0f0f0;
    }
    tr:nth-child(even) { background: #fafaf9; }
    .footer {
      margin-top: 20px;
      padding-top: 10px;
      border-top: 1px solid #e5e7eb;
      display: flex;
      justify-content: space-between;
      font-size: 7pt;
      color: #9ca3af;
    }
    .summary {
      margin-top: 12px;
      display: flex;
      gap: 20px;
      font-size: 8.5pt;
      color: #57534e;
    }
    .summary strong { color: #1a1a1a; }
    @media print {
      body { padding: 15px; }
    }
  </style>
</head>
<body>
  <div class="header">
    <div class="church-name">${churchName}</div>
    ${churchAddress ? `<div class="church-address">${churchAddress}</div>` : ''}
    <div class="report-title">Data Jemaat</div>
    <div class="report-date">Dicetak: ${printDate}</div>
  </div>
  <table>
    <thead>
      <tr>
        <th style="text-align:center;width:30px;">No</th>
        <th style="width:120px;">Nama</th>
        <th style="text-align:center;width:40px;">LK</th>
        <th style="width:80px;">Pekerjaan</th>
        <th style="text-align:center;width:90px;">No Hp/WA</th>
        <th>Alamat</th>
        <th style="text-align:center;width:80px;">Status Nikah</th>
        <th style="text-align:center;width:55px;">Status</th>
      </tr>
    </thead>
    <tbody>
      ${rows}
    </tbody>
  </table>
  <div class="summary">
    <span>Total Jemaat: <strong>${members.length}</strong></span>
    <span>Aktif: <strong>${members.filter(m => m.membershipStatus === 'AKTIF').length}</strong></span>
    <span>Non-Aktif: <strong>${members.filter(m => m.membershipStatus === 'NON-AKTIF').length}</strong></span>
  </div>
  <div class="footer">
    <span>${churchName} - Data Jemaat</span>
    <span>Halaman 1 dari 1</span>
  </div>
  <script>window.onload = function() { window.print(); }</script>
</body>
</html>`;

  return new NextResponse(html, {
    status: 200,
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
    },
  });
}

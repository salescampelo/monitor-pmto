export function exportToCsv(data, filename) {
  if (!data || data.length === 0) {
    alert('Nenhum dado para exportar');
    return;
  }

  const headers = Object.keys(data[0]);
  const csvRows = [
    headers.join(';'),
    ...data.map(row =>
      headers.map(h => {
        let val = row[h] ?? '';
        if (typeof val === 'string') {
          // Prevent CSV formula injection — prefix dangerous leading chars with a single quote
          if (/^[=+\-@]/.test(val)) {
            val = "'" + val;
          }
          if (val.includes(';') || val.includes('"') || val.includes('\n')) {
            val = `"${val.replace(/"/g, '""')}"`;
          }
        }
        return val;
      }).join(';')
    ),
  ];

  const csvString = '\uFEFF' + csvRows.join('\n'); // BOM para UTF-8 no Excel
  const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);

  const link = document.createElement('a');
  link.href = url;
  link.download = `${filename}_${new Date().toISOString().split('T')[0]}.csv`;
  link.click();

  URL.revokeObjectURL(url);
}

export function exportToPdf() {
  window.print();
}

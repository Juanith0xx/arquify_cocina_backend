const fs = require('fs');
let code = fs.readFileSync('src/utils/excelGenerator.ts', 'utf8');

code = code.replace(
  /const range = XLSX\.utils\.decode_range\(ws\['!ref'\]\);/,
  `if (!ws['!ref']) return;\n    const range = XLSX.utils.decode_range(ws['!ref']);`
);

fs.writeFileSync('src/utils/excelGenerator.ts', code);

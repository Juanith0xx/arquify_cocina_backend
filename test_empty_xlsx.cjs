const XLSX = require('xlsx-js-style');
try {
  const ws = XLSX.utils.json_to_sheet([]);
  console.log("Empty sheet works", ws);
} catch(e) {
  console.error("Empty sheet error", e);
}

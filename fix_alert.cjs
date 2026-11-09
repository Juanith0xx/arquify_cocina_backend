const fs = require('fs');
let code = fs.readFileSync('src/utils/kitchenExcelGenerator.ts', 'utf8');
code = code.replace(/} catch\(e: any\) { alert\("EXCEL ERR: " \+ e\.message \+ "\\n" \+ e\.stack\); }/g, '} catch(e: any) { console.error(e); }');
fs.writeFileSync('src/utils/kitchenExcelGenerator.ts', code);

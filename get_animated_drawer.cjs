const fs = require('fs');
let code = fs.readFileSync('src/components/Closet.tsx', 'utf8');
const match = code.match(/function AnimatedDrawer[\s\S]*?<\/group>\n  \);\n}/);
if (match) {
  console.log(match[0]);
} else {
  console.log("Not found");
}

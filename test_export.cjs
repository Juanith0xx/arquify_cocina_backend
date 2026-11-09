const fs = require('fs');

async function test() {
  const code = fs.readFileSync('src/utils/kitchenManufacturing.ts', 'utf8');
  console.log("Read manufacturing");
}
test();

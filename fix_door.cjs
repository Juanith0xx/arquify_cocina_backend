const fs = require('fs');
let content = fs.readFileSync('src/components/Closet.tsx', 'utf8');

content = content.replace(
  `const doorSpaceHeight = height - totalDrawersHeight - (showTopWall ? thickness : 0);`,
  `const doorSpaceHeight = height - totalDrawersHeight;`
);

fs.writeFileSync('src/components/Closet.tsx', content);

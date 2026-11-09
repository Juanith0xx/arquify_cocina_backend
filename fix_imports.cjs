const fs = require('fs');

// The original App.tsx imported components relative to src/
// But now ClosetConfigurator is inside src/pages/, so the relative paths need to go up one directory (../)

let content = fs.readFileSync('src/pages/ClosetConfigurator.tsx', 'utf8');

content = content.replace(/from '\.\/components/g, "from '../components");
content = content.replace(/from '\.\/store'/g, "from '../store'");

fs.writeFileSync('src/pages/ClosetConfigurator.tsx', content);


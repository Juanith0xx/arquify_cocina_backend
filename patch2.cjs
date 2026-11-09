const fs = require('fs');
let bp = fs.readFileSync('src/components/KitchenBlueprint.tsx', 'utf8');

const search = `export function KitchenBlueprint() {
  try {
  const state = useStore();
  const kState = useKitchenStore();`;
bp = bp.replace(search, `export function KitchenBlueprint() {
  const state = useStore();
  const kState = useKitchenStore();`);

fs.writeFileSync('src/components/KitchenBlueprint.tsx', bp);

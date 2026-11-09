import { useAdminStore } from '../store/adminStore';

export function getFriendlyColorName(colorVal?: string, customTextures?: any[]): string {
  if (!colorVal) return 'Blanco Estándar';

  const hexMap: Record<string, string> = {
    '#FFFFFF': 'Blanco Frost',
    '#171717': 'Negro Profundo',
    '#F8F9FA': 'Bianco Polo',
    '#202020': 'Nero',
    '#D4A373': 'Roble Natural',
    '#A3B18A': 'Verde Salvia',
    '#588157': 'Verde Bosque',
    '#3A5A40': 'Verde Olivo',
    '#E0E1DD': 'Gris Humo',
    '#778DA9': 'Azul Nórdico',
    '#415A77': 'Azul Petróleo',
    '#1B263B': 'Azul Noche',
    '#2B2D42': 'Grafito Mate',
    '#8D99AE': 'Gris Plata',
    '#EDF2F4': 'Blanco Nieve',
    '#DDA15E': 'Madera Teca',
    '#BC6C25': 'Nogal Ceniza',
  };

  const upper = colorVal.toUpperCase();
  if (hexMap[upper]) return hexMap[upper];

  // Check admin store textures (all official brand textures + user added textures)
  let adminTextures: any[] = [];
  try {
    adminTextures = useAdminStore.getState().textures || [];
  } catch {}

  const allTextures = [...(customTextures || []), ...adminTextures];
  if (allTextures.length > 0) {
    const found = allTextures.find((t: any) =>
      t && (
        t.url === colorVal ||
        t.previewUrl === colorVal ||
        t.id === colorVal ||
        (t.name && t.name.toLowerCase() === colorVal.toLowerCase())
      )
    );
    if (found?.name) {
      const brand = found.brand || found.providerName;
      if (brand && !found.name.toLowerCase().includes(brand.toLowerCase())) {
        return `${brand} ${found.name}`;
      }
      return found.name;
    }
  }

  // Base64 or long data URIs without a name match
  if (colorVal.startsWith('data:')) {
    return 'Textura Personalizada';
  }

  if (colorVal.startsWith('#')) return `Color ${colorVal}`;

  const parts = colorVal.split('/');
  const last = parts[parts.length - 1].replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ');
  return last || 'Acabado Estándar';
}

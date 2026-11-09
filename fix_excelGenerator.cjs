const fs = require('fs');
let code = fs.readFileSync('src/utils/excelGenerator.ts', 'utf8');

const regex = /if \(material === 'hpl'\) \{([\s\S]*?)\}\n  \};\n/g;

const replacement = `if (material === 'hpl') {
$1
    }
    
    // Y siempre agregamos la placa de sustrato (MDF o Melamina) a dataPlacas
    // Si es HPL, el sustrato es MDF desnudo (15mm o según thickness)
    const baseMaterial = material === 'hpl' ? 'MDF Desnudo (Sustrato)' : decorName;
    
    dataPlacas.push({
      'Gabinete': gabinete,
      'Pieza': name,
      'Material': materialName || material, // Usa el material pasado (ej. 'melamina')
      'Decorativo': baseMaterial,
      'Cortes Totales': qty,
      'Cantidad': qty,
      'Largo (mm)': (h * 10).toFixed(1),
      'Ancho (mm)': (w * 10).toFixed(1),
      'Veta (Orientación)': 'Vertical',
      'Espesor (mm)': state.thickness,
      'Tapacanto Largo 1': cantosLargo > 0 ? 'Sí' : 'No',
      'Tapacanto Largo 2': cantosLargo > 1 ? 'Sí' : 'No',
      'Tapacanto Ancho 1': cantosAncho > 0 ? 'Sí' : 'No',
      'Tapacanto Ancho 2': cantosAncho > 1 ? 'Sí' : 'No',
      'isFront': isFront
    });
  };
`;

code = code.replace(regex, replacement);
fs.writeFileSync('src/utils/excelGenerator.ts', code);

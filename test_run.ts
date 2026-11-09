global.localStorage = { length: 0, getItem: () => null, setItem: () => {}, removeItem: () => {}, clear: () => {}, key: () => null };

import { generateKitchenPartsList, generateKitchenHardwareList } from './src/utils/kitchenManufacturing';
import { useKitchenStore } from './src/store/kitchenStore';
import { useStore } from './src/store';

try {
    const kState = useKitchenStore.getState();
    kState.cabinets.push({
      id: 'test', type: 'base', variant: '2_doors',
      width: 60, height: 90, depth: 60, position: [0, 0, 0], rotation: 0, color: '#f8fafc'
    });
    console.log("Cabinets:", kState.cabinets.length);
    const parts = generateKitchenPartsList(kState.cabinets);
    console.log("Parts:", parts.length);
    const hardware = generateKitchenHardwareList(kState.cabinets);
    console.log("Hardware:", hardware.length);
} catch (e) {
    console.error("ERROR CAUGHT:", e);
}

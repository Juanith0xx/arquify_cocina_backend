const THREE = require('three');
const euler = new THREE.Euler(0, 0, Math.PI/2);
const yAxis = new THREE.Vector3(0, -1, 0);
yAxis.applyEuler(euler);
console.log("Local -Y axis points to:", yAxis);

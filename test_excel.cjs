async function test() {
    try {
        const { exportKitchenToExcel } = require('./dist/server.cjs'); // wait no, we can't easily require vite TS modules.
    } catch(e) {
        console.error(e);
    }
}
test();

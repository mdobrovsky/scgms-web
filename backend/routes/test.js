const addon = require('../build/Release/scgms_wrapper.node');

try {
    // Zavolání wrapperu
    const filters = addon.listAvailableFilters();
    console.log('Dostupné filtry:');
    console.log(filters);
} catch (error) {
    console.error('Chyba:', error);
}
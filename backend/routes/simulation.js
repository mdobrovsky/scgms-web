const express = require('express');
const router = express.Router();

const { execFile } = require('child_process');
const {join} = require("path");
const {readFile} = require("fs");
// Endpoint for sim start
router.get('/start', (req, res) => {
    res.json({ message: 'Simulation started' });
});

// Endpoint for sim end
router.post('/stop', (req, res) => {
    // Zde přidejte kód pro zastavení simulace
    res.json({ message: 'Simulation stopped' });
});

// Endpoint to read filters from file
router.get('/filters', (req, res) => {
    const filePath = join(__dirname, './filter_list.txt');

    // Načti filtry ze souboru
    readFile(filePath, 'utf8', (err, data) => {
        if (err) {
            console.error('Error reading filters_list.txt:', err);
            return res.status(500).json({ error: 'Failed to read filters' });
        }

        // Rozděl text podle řádků a odstraň prázdné řádky
        const filters = data.split('\n').filter(line => line.trim() !== '');

        // Vrácení seznamu filtrů
        res.json({ filters });
    });
});

module.exports = router;



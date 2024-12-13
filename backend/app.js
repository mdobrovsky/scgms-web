const express = require('express');
const app = express();
const PORT = 3000;
const simulationRoutes = require('./routes/simulation');
const cors = require('cors');
app.use(cors());

app.use('/simulation', simulationRoutes);

app.use(express.json());

// Testovací endpoint
app.get('/test', (req, res) => {
    res.json({message: 'Middleware API is running'});
});

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});






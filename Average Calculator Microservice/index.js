const express = require('express');
const app = express();
const PORT = 9876;

const ACCESS_TOKEN = "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJNYXBDbGFpbXMiOnsiZXhwIjoxNzQ4MjQyNDU4LCJpYXQiOjE3NDgyNDIxNTgsImlzcyI6IkFmZm9yZG1lZCIsImp0aSI6IjQxNmFkYzhhLWU0MmYtNGZmMC05ODI1LTQ4YmI3ZGZlMzg0MSIsInN1YiI6IjIyMTAyYTA0MTExNUBtYnUuYXNpYSJ9LCJlbWFpbCI6IjIyMTAyYTA0MTExNUBtYnUuYXNpYSIsIm5hbWUiOiJ2IGsgbml0aHlhbmFuZCIsInJvbGxObyI6IjIyMTAyYTA0MTExNSIsImFjY2Vzc0NvZGUiOiJkSkZ1ZkUiLCJjbGllbnRJRCI6IjQxNmFkYzhhLWU0MmYtNGZmMC05ODI1LTQ4YmI3ZGZlMzg0MSIsImNsaWVudFNlY3JldCI6Ild3eUJNSHVWTlBRRVJEam0ifQ.dI4IkctvNbnB7PDmVLVtz1VlmHosroG3XPPo6AK1h8w";

const SOURCES = {
    p: 'http://20.244.56.144/evaluation-service/primes',
    f: 'http://20.244.56.144/evaluation-service/fibo',
    e: 'http://20.244.56.144/evaluation-service/even',
    r: 'http://20.244.56.144/evaluation-service/rand'
};

const WINDOW_SIZE = 10;
let windowNumbers = [];

app.get('/numbers/:numberid', async (req, res) => {
    const { numberid } = req.params;
    const sourceUrl = SOURCES[numberid];

    if (!sourceUrl) {
        res.status(400).json({ error: 'Invalid number ID. Use p, f, e, or r.' });
        return;
    }

    try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 500);

        const response = await fetch(sourceUrl, {
            headers: { Authorization: ACCESS_TOKEN },
            signal: controller.signal
        });

        clearTimeout(timeout);

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`HTTP ${response.status}: ${errorText}`);
        }

        const data = await response.json();
        const newNumbers = data.numbers || [];
        const prevWindow = windowNumbers.slice();

        newNumbers.forEach(num => {
            if (!windowNumbers.includes(num)) {
                windowNumbers.push(num);
            }
        });

        if (windowNumbers.length > WINDOW_SIZE) {
            windowNumbers = windowNumbers.slice(-WINDOW_SIZE);
        }

        const avg = windowNumbers.length
            ? parseFloat((windowNumbers.reduce((a, b) => a + b, 0) / windowNumbers.length).toFixed(2))
            : 0;

        res.json({
            windowPrevState: prevWindow,
            windowCurrState: windowNumbers.slice(),
            numbers: newNumbers,
            avg
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.listen(PORT, () => {
    console.log(`Server is running at http://localhost:${PORT}`);
});
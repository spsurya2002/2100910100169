const express = require('express');
const axios = require('axios');

const app = express();
const port = 9876;
const windowSize = 10;
const numberTypes = {
    'p': 'primes',
    'f': 'fibo',
    'e': 'even',
    'r': 'rand'
};

let windowNumbers = [];
let uniqueNumbers = new Set();

const AUTHORIZATION_TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJNYXBDbGFpbXMiOnsiZXhwIjoxNzIxNDUzMjg1LCJpYXQiOjE3MjE0NTI5ODUsImlzcyI6IkFmZm9yZG1lZCIsImp0aSI6IjdjYjEwNzQyLThhMTgtNDI1Zi1iMjQzLWJmZGY1MjFlODM3YiIsInN1YiI6IlN1cnlhMjcxMDIxQGdtYWlsLmNvbSJ9LCJjb21wYW55TmFtZSI6IkFmZm9yZG1lZCIsImNsaWVudElEIjoiN2NiMTA3NDItOGExOC00MjVmLWIyNDMtYmZkZjUyMWU4MzdiIiwiY2xpZW50U2VjcmV0IjoiS2ZVbXFlclZmQVdHdGFTYyIsIm93bmVyTmFtZSI6IlN1cnlhIFByYWthc2ggTWlzaHJhIiwib3duZXJFbWFpbCI6IlN1cnlhMjcxMDIxQGdtYWlsLmNvbSIsInJvbGxObyI6IjIxMDA5MTAxMDAxNjkifQ.lvDlpw7bvqM4xuMi-Ra3WLLlhPCHRcEijsxu9KkaZgc'

app.get('/numbers/:numberid', async (req, res) => {
    const numberId = req.params.numberid;
    // Validate the number ID
    if (!numberTypes.hasOwnProperty(numberId)) {
        return res.status(400).json({ error: 'Invalid number ID' });
    }

    try {
        console.log(`Fetching numbers from: http://20.244.56.144/test/${numberTypes[numberId]}`);
        const response = await axios.get(`http://20.244.56.144/test/${numberTypes[numberId]}`, {
            timeout: 500,
            headers: {
                'Authorization': `Bearer ${AUTHORIZATION_TOKEN}`
            }
        });
        // Filter out numbers that are already in the uniqueNumbers set
        const newNumbers = response.data.numbers.filter(num => !uniqueNumbers.has(num));

        console.log(`Received numbers: ${newNumbers}`);

        if (newNumbers.length > 0) {
            windowNumbers.push(...newNumbers);
            newNumbers.forEach(num => uniqueNumbers.add(num));
        // Ensure the window size does not exceed the defined limit
            if (windowNumbers.length > windowSize) {
                const excessNumbers = windowNumbers.length - windowSize;
                for (let i = 0; i < excessNumbers; i++) {
                    uniqueNumbers.delete(windowNumbers.shift());
                }
            }
        }

        const windowPrevState = [...windowNumbers];

        // Calculate the average of the numbers in the current window
        const avg = windowNumbers.reduce((acc, num) => acc + num, 0) / windowNumbers.length;
        // Send the response with the required format
        res.json({
            numbers: newNumbers,
            windowPrevState: windowPrevState,
            windowCurrState: windowNumbers,
            avg: avg.toFixed(2)
        });

    } catch (error) {
        console.error('Error fetching numbers from test server:', error.message);
        if (error.code === 'ECONNABORTED') {
            return res.status(500).json({ error: 'Test server response time exceeded 500ms' });
        } else if (error.response) {
            console.error('Server responded with status:', error.response.status);
            return res.status(error.response.status).json({ error: error.response.data });
        } else {
            return res.status(500).json({ error: 'Unknown error fetching numbers from test server' });
        }
    }
});

app.listen(port, () => {
    console.log(`Average Calculator HTTP Microservice running at http://localhost:${port}`);
});

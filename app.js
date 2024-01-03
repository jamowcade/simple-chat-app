const express = require('express');
const bodyParser = require('body-parser');
const moment = require('moment');
const fs = require('fs/promises');  // Using promises version of fs for async operations
const requestIp = require('request-ip'); // Add request-ip module for IP address extraction

const app = express();
const port = 3000;
const my_ip = "10.30.1.42";

// Middleware
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static('public'));
app.use(requestIp.mw()); // Middleware to extract user's IP address

// Route to render the inbox page
app.get('/inbox', (req, res) => {
    res.sendFile(__dirname + '/public/inbox.html');
});

// Route to handle incoming messages
app.post('/send', async (req, res) => {
    const user = req.clientIp;
    const message = {
        text: req.body.message,
        timestamp: moment(),
        user: user, // You can customize this based on your application needs
    };

    // Add message to the 'messages' array
    const messages = await readMessages();
    messages.push(message);

    // Write messages back to the JSON file
    await writeMessages(messages);

    res.redirect('/inbox');
});

// Route to get messages for the inbox
app.get('/getMessages', async (req, res) => {
    const messages = await readMessages();
    res.json(messages);
});

// Read messages from the JSON file
async function readMessages() {
    try {
        const content = await fs.readFile('messages.json', 'utf-8');

        // Check if the content is not an empty string
        if (content.trim() === '') {
            return [];
        }

        const messages = JSON.parse(content);

        // Parse timestamps back to moment objects
        messages.forEach(message => {
            // Parse the timestamp using moment to avoid deprecation warning
            message.timestamp = moment(message.timestamp, moment.ISO_8601);
        });

        return messages;
    } catch (error) {
        // If the file doesn't exist yet, return an empty array
        if (error.code === 'ENOENT') {
            return [];
        }
        throw error;
    }
}


// Write messages to the JSON file
async function writeMessages(messages) {
    await fs.writeFile('messages.json', JSON.stringify(messages, null, 2), 'utf-8');
}

// Start the server
const server = app.listen(port, my_ip, () => {
    const { address, port } = server.address();
    console.log(`Server is running at http://${address}:${port}`);
});

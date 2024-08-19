const fetch = require('node-fetch');
require('dotenv').config(); // Loads environment variables from .env file

async function sendTemplateMessage(day, course_name, senderID) {
    const options = {
        method: 'POST',
        url: `https://${process.env.WATI_URL}/api/v1/sendTemplateMessage?whatsappNumber=${senderID}`,
        headers: {
            'Authorization': `Bearer ${process.env.API}`, // Assuming API key is passed as Bearer token
            'Content-Type': 'application/json-patch+json'
        },
        body: JSON.stringify({
            "template_name": "hester001",
            "broadcast_name": "hester001",
            "parameters": [
                {
                    "name": "day",
                    "value": day
                },
                {
                    'name': "course_name",
                    "value": course_name
                }
            ]
        })
    };

    try {
        const response = await fetch(options.url, {
            method: options.method,
            headers: options.headers,
            body: options.body
        });

        const data = await response.json();
        console.log("Template Message Response:", data);
        return data;
    } catch (error) {
        console.error("Error sending template message:", error);
        throw error;
    }
}

async function sendReminder(template_name, senderID) {
    const options = {
        method: 'POST',
        url: `https://${process.env.WATI_URL}/api/v1/sendTemplateMessage?whatsappNumber=${senderID}`,
        headers: {
            'Authorization': `Bearer ${process.env.WATI_API}`, // Assuming API key is passed as Bearer token
            'Content-Type': 'application/json-patch+json'
        },
        body: JSON.stringify({
            "template_name": template_name,
            "broadcast_name": "test",
            "parameters": []
        })
    };

    try {
        const response = await fetch(options.url, {
            method: options.method,
            headers: options.headers,
            body: options.body
        });

        const data = await response.json();
        console.log("Reminder Status:", response.status);
        console.log("Reminder Response:", data);
        return data;
    } catch (error) {
        console.error("Error sending reminder:", error);
        throw error;
    }
}

module.exports = {
    sendTemplateMessage,
    sendReminder
};

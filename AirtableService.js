//AirtableService.js
const fetch = require('node-fetch');

class AirtableService {
    constructor(apiKey, baseId) {
        this.apiKey = apiKey;
        this.baseId = baseId;
        this.baseUrl = `https://api.airtable.com/v0/${this.baseId}`;
    }

    async fetchRecords(tableId, params = {}) {
        try {
            const url = new URL(`${this.baseUrl}/${tableId}`);

            // Append query parameters to the URL
            Object.keys(params).forEach(key => url.searchParams.append(key, params[key]));

            const response = await fetch(url, {
                headers: {
                    'Authorization': `Bearer ${this.apiKey}`,
                    'Content-Type': 'application/json'
                }
            });

            // Check if response is 403 (Forbidden)
            if (response.status === 403) {
                throw new Error(`Failed to fetch records from Airtable: ${response.status} Forbidden. Please check your API key, Base ID, and Table ID.`);
            }

            // Log response status for debugging
            console.log("Response Status:", response.status);

            const data = await response.json();

            // Handle potential errors in the response
            if (data.error) {
                throw new Error(`Error from Airtable: ${data.error.message}`);
            }

            return data;
        } catch (error) {
            console.error('Error in fetchRecords:', error.message);
            throw error;
        }
    }

    async updateRecord(tableId, recordId, fields) {
        try {
            const url = `${this.baseUrl}/${tableId}/${recordId}`;
            const response = await fetch(url, {
                method: 'PATCH',
                headers: {
                    'Authorization': `Bearer ${this.apiKey}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ fields })
            });

            if (!response.ok) {
                throw new Error(`Failed to update record: ${response.status}`);
            }

            return await response.json();
        } catch (error) {
            console.error('Error in updateRecord:', error.message);
            throw error;
        }
    }
}

module.exports = AirtableService;

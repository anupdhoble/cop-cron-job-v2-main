class StudentManager {
    constructor(airtableService, messageService) {
        this.airtableService = airtableService;
        this.messageService = messageService;
    }

    async getStudentNumbers(tableId) {
        try {
            const data = await this.airtableService.fetchRecords(tableId, { view: 'Grid view' });

            if (data.records.length === 0) throw new Error('Student not found');

            for (const record of data.records) {
                try {
                    // Fetch total days dynamically
                    const totalDays = await this.totalDays(record.fields['Phone']);
                    await this.sendContent(record, tableId, totalDays);
                } catch (e) {
                    console.log("Error sending content:", e.message);
                }
            }            
        } catch (error) {
            console.error('Error in getStudentNumbers:', error.message);
        }
    }
    
    async totalDays(phoneNumber) {
        try {
            const courseTableName = await this.findTable(phoneNumber, "Phone");
            const url = `https://api.airtable.com/v0/${course_base}/${courseTableName}?fields%5B%5D=Day`;
            
            const response = await fetch(url, {
                headers: {
                    'Authorization': `Bearer ${process.env.Airtable_apiKey}`,
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                const errorBody = await response.text();
                throw new Error(`HTTP error! status: ${response.status}, body: ${errorBody}`);
            }

            const data = await response.json();
            return data.records.length; // Return the total number of days
        } catch (error) {
            console.error('Error in totalDays:', error.message);
            throw error;
        }
    }

    async sendContent(record, tableId, totalDays) {
        try {
            // Extracting fields from the record object
            const td = totalDays; // Dynamically set total days
            const day = record.fields['Next Day'];
            const studentName = record.fields['Name'];
            const course = "Sample Course"; // Hardcoded course name
            const id = record.id;
            const last_msg = record.fields['Last_Msg'];
            const completed_Day = record.fields['Day Completed'];

            console.log(`Day: ${day}`);
            console.log(`Processing student: ${studentName}`);
            console.log(`Last message status: ${last_msg}`);

            const startCourseReminder = `Hey, don't forget to begin your module for the day! 

We understand you can be busy and taking out time can easily slip your mind. But it is important for personal and professional growth, so be sure to complete the course. 

We promise it won't take too long.`;

            const reminderMessage = `Hey there! 

You are so close. You are almost done with the course for today, would you like to finish the module right now? 

To continue please click on the appropriate button above.
powered by ekatra.one`;

            if (completed_Day < td && completed_Day !== undefined) {
                try {
                    console.log("Executing logic for student...");

                    if (last_msg === "start_day_temp" || last_msg === "Let's Begin") {
                        const sendMessage = await this.messageService.sendReminder("start_day_reminder", record.fields['Phone']);
                        // if (sendMessage === 200) {
                        //     await this.airtableService.updateRecord(tableId, id, { "Last_Msg": "reminder_template" });
                        // }
                    } else {
                        const sendMessage = await this.messageService.sendReminder("reminder_message", record.fields['Phone']);
                        // if (sendMessage === 200) {
                        //     await this.airtableService.updateRecord(tableId, id, { "Last_Msg": "reminder_template" });
                        // }
                    }
                } catch (e) {
                    console.error("sendContent error", e.message);
                }
            }
        } catch (error) {
            console.error('Error in sendContent:', error.message);
            throw error;
        }
    }

    async findTable(phoneNumber, contact) {
        const url = `https://api.airtable.com/v0/${process.env.studentBase}/${process.env.studentTable}`;
        const params = new URLSearchParams({
            filterByFormula: `({${contact}} = "${phoneNumber}")`,
            view: 'Grid view'
        });

        try {
            const response = await fetch(`${url}?${params}`, {
                headers: {
                    'Authorization': `Bearer ${process.env.Airtable_apiKey}`,
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                const errorBody = await response.text();
                throw new Error(`HTTP error! status: ${response.status}, body: ${errorBody}`);
            }

            const data = await response.json();
            if (data.records && data.records.length > 0) {
                return data.records[0].fields.Topic; // Return the course table name
            } else {
                throw new Error('No matching record found');
            }
        } catch (error) {
            console.error('Error in findTable:', error.message);
            throw error;
        }
    }
}

module.exports = StudentManager;

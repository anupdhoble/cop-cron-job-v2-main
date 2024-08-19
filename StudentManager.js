//StudentManager.js
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
                    
                    await this.sendContent(record, tableId);
                } catch (e) {
                    console.log("Error sending content:", e.message);
                }
            }            
        } catch (error) {
            console.error('Error in getStudentNumbers:', error.message);
        }
    }
    
    async sendContent(record, tableId) {
        try {
            // Extracting fields from the record object
            const td = 30; // Hardcoded total days, replace with the actual number of days in the course
            const day = record.fields['Next Day'];
            const studentName = record.fields['Name'];
            const course = "Sample Course"; // Hardcoded course name
            const id = record.id;
            const last_msg = record.fields['Last_Msg'];
            const completed_Day = record.fields['Day Completed'];
            console.log(`Day: ${day}`);
            console.log(`Processing student: ${studentName}`);
            console.log(`Last message status: ${last_msg}`);

            // Hardcoded title
            const titleList = ["Sample Lesson Title", ["Option 1", "Option 2"]];
            const title = titleList;

            if (completed_Day < td && completed_Day !== undefined) {
                try {
                    console.log("Executing logic for student...");
                    if (last_msg === "start_day_temp" || last_msg === "Let's Begin") {
                        const sendMessage = await this.messageService.sendReminder("start_day_reminder", record.fields['Phone']);
                        if (sendMessage === 200) {
                            await this.airtableService.updateRecord(tableId, id, { "Last_Msg": "reminder_template" });
                        }
                    } else if (last_msg.includes("Congratulations on completing Day")) {
                        const sendMessage = await this.messageService.sendTemplateMessage(day, course, record.fields['Phone']);
                        if (sendMessage === 200) {
                            await this.airtableService.updateRecord(tableId, id, { "Last_Msg": "start_day_temp" });
                        }
                    } else if (last_msg.includes("reminder_template")) {
                        console.log("Do nothing");
                    } else if (title.includes(last_msg) || last_msg === "Incorrect") {
                        await this.messageService.sendReminder("reminder_message", record.fields['Phone']);
                    } else {
                        await this.messageService.sendReminder("reminder_message", record.fields['Phone']);
                        if (sendMessage === 200) {
                            await this.airtableService.updateRecord(tableId, id, { "Last_Msg": "reminder_template" });
                        }
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
}

module.exports = StudentManager;

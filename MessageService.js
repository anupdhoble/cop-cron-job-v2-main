// MessageService.js
class MessageService {
    constructor(watiInstance) {
        this.wati = watiInstance;
    }

    async sendReminder(templateName, number) {
        return this.wati.sendReminder(templateName, number);
    }

    async sendTemplateMessage(day, course, number) {
        return this.wati.sendTemplateMessage(day, course, number);
    }
}

module.exports = MessageService;

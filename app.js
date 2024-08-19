//app.js
require('dotenv').config();
const express = require('express');
const AirtableService = require('./AirtableService');
const MessageService = require('./MessageService');
const StudentManager = require('./StudentManager');

const app = express();
app.use(express.json());
const studentTableId= "tblGmdKLjlwPkzJ4J";
const airtableService = new AirtableService(process.env.Airtable_apiKey, process.env.studentBase);
const messageService = new MessageService(require('./wati'));
const studentManager = new StudentManager(airtableService, messageService);
app.get('/ping',async(req,res)=>{
    res.send("Ok");
});
app.get('/cop', async (req, res) => {
    try {
        await studentManager.getStudentNumbers(studentTableId);
        res.send("ok");
    } catch (e) {
        console.error("error " + e);
        res.status(500).send("Error occurred");
    }
});

app.listen(process.env.PORT, () => {
    console.log(`Server is running on port ${process.env.PORT}`);
});
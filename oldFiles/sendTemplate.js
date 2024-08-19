//sendTemplate.js
require('dotenv').config("./env");
var Airtable = require('airtable');
const WA = require('./wati.js');
const express = require('express')
const app = express()
app.use(express.json())

// let base = new Airtable({ apiKey: process.env.apiKey }).base(process.env.student_base);
// let course_base = new Airtable({ apiKey: process.env.apiKey }).base(process.env.course_base);

let studentTable = process.env.studentTable;
let student_base = process.env.studentBase
let course_base = process.env.course_base
// let baseId = process.env.baseId;
let apiKey = process.env.personal_access_token;

//Webhook code


// async function getStudentNumbers(studentTable, contact) {

//     var numbersToMessage = []
//     const records = await base(`${studentTable}`).select({
//         view: "Grid view"
//     }).all();
//     // return new Promise((resolve, reject) => {
//     records.forEach(function (record) {
//         let number = record.get(contact)
//         course = record.get("Topic")
//         numbersToMessage.push(number)

//     });
//     // console.log("numbersToMessage ", numbersToMessage, course, course != "Financial Literacy" || course != "Web 3" || course != "Entrepreneurship")
//     // if (course != "Financial Literacy" && course != "Web 3" && course != "Entrepreneurship") {
//     // numbersToMessage = await removeDuplicates(numbersToMessage)
//     console.log(`Total Numbers in ${studentTable} ${numbersToMessage.length}`)

//     for (let i = 0; i < numbersToMessage.length; i++) {

//         sendContent(numbersToMessage[i], studentTable, contact).then().catch(e => console.log("Airtable error", e.status_code))

//         // }
//     }


// }
async function getStudentNumbers(tableId, contact) {

    try {
        const url = `https://api.airtable.com/v0/${student_base}/${studentTable}`;

        const params = new URLSearchParams({
            view: 'Grid view'
        });

        const response = await fetch(`${url}?${params}`, {
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json'
            }
        });

        // console.log(`${url}?${params}`)

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();


        if (!data.records || data.records.length === 0) {
            console.log("No records found in the table");
            return;
        }

        const numbersToMessage = data.records.map(record => record.fields[contact]);


        console.log(`Total Numbers in ${tableId}: ${numbersToMessage.length}`);

        for (let i = 0; i < numbersToMessage.length; i++) {
            try {
                await sendContent(numbersToMessage[i], tableId, contact);
            } catch (e) {
                console.log("Error sending content:", e);
            }
        }
    } catch (error) {
        console.error('Error in getStudentNumbers:', error);
    }
}

async function sendContent(number, tableId, contact) {

    try {
        const url = `https://api.airtable.com/v0/${student_base}/${studentTable}`;
        const params = new URLSearchParams({
            filterByFormula: `{${contact}} = "${number}"`,
            maxRecords: '1',
            view: 'Grid view'
        });


        const response = await fetch(`${url}?${params}`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();

        if (data.records.length === 0) {
            throw new Error('Student not found');
        }

        const record = data.records[0].fields;

        // Fetch additional data
        console.log("Table ", number, contact)
        const [td, course, id] = await Promise.all([
            totalDays(number),
            findTable(number, contact),
            getID(contact, number)
        ]).then(console.log("I am complete"));

        const studentName = record.Name;
        const completed_Day = record['Day Completed'];
        const day = record['Next Day'];
        const next_module = record['Next Module'];
        const completed_module = record['Module Completed'];
        const last_msg = record.Last_Msg;

        const startDay_reminder = `Hey, don't forget to begin your module for the day! 

We understand you can be busy and taking out time can easily slip your mind. But it is important for personal and professional growth, so be sure to complete the course. 

We promise it won't take too long. `;

        const reminder_message = `Hey there! 

You are so close. You are almost done with the course for today, would you like to finish the module right now? 

To continue please click on the appropriate button above. 
powered by ekatra.one
`;

        const list = await findTitle(day, next_module, number);
        const title = list;
        console.log("1. title ", studentName);

        if (completed_Day < td && completed_Day != undefined) {
            try {
                console.log("number ", number, course, tableId);

                if (last_msg == "start_day_temp" || last_msg == "Let's Begin") {
                    console.log("a. Sending reminder notification to ", number, course);
                    send_message = await WA.sendReminder("start_day_reminder", number);
                    if (send_message == 200) {
                        await updateField(id, "Last_Msg", "reminder_template");
                    }

                } else if (last_msg.includes("Congratulations on completing Day")) {
                    console.log("0. Sending START DAY notification", number, day, tableId);
                    send_message = await WA.sendTemplateMessage(day, course, number);
                    if (send_message == 200) {
                        await updateField(id, "Last_Msg", "start_day_temp");
                    }


                } else if (last_msg.includes("reminder_template")) {
                    console.log("Do nothing");
                } else if (title.includes(last_msg) || last_msg == "Incorrect") {
                    console.log("0.4 Certificate - Sending REMINDER_TEMPLATE notification", number);

                    send_message = await WA.sendReminder("reminder_message", number);

                } else {
                    console.log("4. Sending reminder notification no condition matched ", number, course);

                    send_message = await WA.sendReminder("reminder_message", number);
                    if (send_message == 200) {
                        await updateField(id, "Last_Msg", "reminder_template");

                    }

                }
            } catch (e) {
                console.error("sendContent error " + e);
            }
        }

        // return { studentName, completed_Day, day, next_module, completed_module, last_msg, td, course, id };
    } catch (error) {
        console.error('Error in sendContent:', error);
        throw error;
    }
}

const totalDays = async (number) => {
    try {


        // Assuming findTable is a function you've defined elsewhere
        const course_tn = await findTable(number, "Phone");
        // console.log("course_tn", course_tn);

        const url = `https://api.airtable.com/v0/${course_base}/${course_tn}?fields%5B%5D=Day`;
        // console.log(url)



        const response = await fetch(`${url}`, {
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            const errorBody = await response.text();
            throw new Error(`HTTP error! status: ${response.status}, body: ${errorBody}`);
        }

        const data = await response.json();

        const count = data.records.length;
        // console.log(count);
        return count;

    } catch (error) {
        console.error('Error in totalDays:', error);
        // //throw error;
    }
};

const findTable = async (number, contact) => {

    const url = `https://api.airtable.com/v0/${student_base}/${studentTable}`;

    const params = new URLSearchParams({
        filterByFormula: `({${contact}} = "${number}")`,
        view: 'Grid view'
    });

    try {
        const response = await fetch(`${url}?${params}`, {
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            const errorBody = await response.text();
            throw new Error(`HTTP error! status: ${response.status}, body: ${errorBody}`);
        }

        const data = await response.json();

        if (data.records && data.records.length > 0) {
            const course_tn = data.records[0].fields.Topic;
            // console.log("Table Name = " + course_tn);
            return course_tn;
        } else {
            // throw new Error('No matching record found');
        }
    } catch (error) {
        console.error('Error in findTable:', error);
        //throw error;
    }
};

async function getID(contact, number) {


    const url = `https://api.airtable.com/v0/${student_base}/${studentTable}`;

    const params = new URLSearchParams({
        filterByFormula: `(${contact} = "${number}")`,
        view: 'Grid view'
    });

    try {
        const response = await fetch(`${url}?${params}`, {
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            const errorBody = await response.text();
            throw new Error(`HTTP error! status: ${response.status}, body: ${errorBody}`);
        }

        const data = await response.json();

        if (data.records && data.records.length > 0) {
            const id = data.records[0].id;
            console.log("id", id);
            return id;
        } else {
            throw new Error('No matching record found');
        }
    } catch (error) {
        console.error('Error in getID:', error);
        //throw error;
    }
}

// const findTable = async (number, tableId, contact) => {
//     const course_table = await base(`${tableId}`).select({
//         filterByFormula: "({" + contact + "} = " + number + ")",
//         view: "Grid view"
//     }).all();

//     return new Promise((resolve, reject) => {
//         course_tn = ""
//         course_table.forEach(function (record) {
//             course_tn = record.get("Course")
//             // console.log("2. course_tn ", course_tn)
//             resolve(course_tn)
//             // reject("error")

//         })
//     })
// }

// async function getID(contact, tableId, number) {
//     // let course_tn = await findTable(number, tableId, contact)
//     // console.log("getID course_tn ", course_tn)

//     return new Promise(async function (resolve, reject) {
//         const course_table = await base(tableId).select({
//             filterByFormula: "({" + contact + "} = " + number + ")",
//             view: "Grid view"
//         }).all();

//         course_table.forEach(function (record) {


//             let id = record.id
//             console.log("id", id)
//             resolve(id)
//             reject("Error")
//         })
//     })

// }

async function updateField(id, field_name, updatedValue) {
    try {
        // const tableName = 'Test'; // Replace with your table name
        const url = `https://api.airtable.com/v0/${student_base}/${studentTable}/${id}`;
        // console.log("Update URL ",url)

        const response = await fetch(url, {
            method: 'PATCH',
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                fields: {
                    [field_name]: updatedValue
                }
            })
        });

        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }

        const data = await response.json();
        console.log('Record updated successfully:');
    } catch (error) {
        console.error('Error updating record:', error);
    }
}

const findTitle = async (currentDay, module_no, number) => {

    try {
        // First, get the course table name
        const course_tn = await findTable(number, "Phone");
        console.log(currentDay, module_no, number, course_tn)

        const url = `https://api.airtable.com/v0/${course_base}/${course_tn}`;

        const params = new URLSearchParams({
            filterByFormula: `({Day} = ${currentDay})`,
            view: 'Grid view'
        });

        const response = await fetch(`${url}?${params}`, {
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            const errorBody = await response.text();
            throw new Error(`HTTP error! status: ${response.status}, body: ${errorBody}`);
        }

        const data = await response.json();

        if (data.records && data.records.length > 0) {
            for (const record of data.records) {
                const titleField = `Module ${module_no} LTitle`;
                const optionsField = `Module ${module_no} List`;

                const title = record.fields[titleField];
                const options = record.fields[optionsField];

                if (title !== undefined) {
                    console.log(title, options.split("\n"));
                    return [title, options.split("\n")];
                }
            }
            // If we've gone through all records and haven't returned, no matching title was found
            return [0, 0];
        } else {
            return [0, 0];
        }
    } catch (error) {
        console.error('Error in findTitle:', error);
        // //throw error;
    }
};
// getStudentNumbers("Student", "Phone")
// async function sendContent(number, studentTable, contact) {
//     const records_Student = await base(`${studentTable}`).select({
//         filterByFormula: `${contact} = ${number}`,
//         view: "Grid view",
//         maxRecords: 1

//     }).all();

//     let td = await totalDays(number, studentTable, contact)
//     let course = await findTable(number, studentTable, contact)
//     console.log("course ", course, number, studentTable, contact, td)
//     records_Student.forEach(async function (record) {
//         if (course != "Financial Literacy" || course != "Web 3" || course != "Entrepreneurship") {

//             studentName = record.get("Name")
//             // course = record.get("Topic")
//             completed_Day = record.get("Day Completed")
//             let day = record.get("Next Day")
//             // console.log(day)

//             next_module = record.get("Next Module")

//             completed_module = record.get("Module Completed")

//             let last_msg = record.get("Last_Msg")
//             if (last_msg == undefined) {

//                 last_msg = ""
//             }
//             let id = await getID(contact, studentTable, number).then().catch(e => console.log("e0 ", e))

//             let startDay_reminder = `Hey, don’t forget to begin your module for the day! 

// We understand you can be busy and taking out time can easily slip your mind. But it is important for personal and professional growth, so be sure to complete the course. 

// We promise it won't take too long. `

//             let reminder_message = `Hey there! 

// You are so close. You are almost done with the course for today, would you like to finish the module right now? 

// To continue please click on the appropriate button above. 
// powered by ekatra.one
// `
//             console.log(1)
//             let list = await findTitle(day, next_module, course, number).then().catch(e => console.error("e1 ", e))


//             // let title = list
//             console.log(td, last_msg, list)
//             if (list != undefined) {
//                 console.log("1. title ", number, list, list.includes(last_msg))
//             }


//             if (completed_Day < 4 && completed_Day != undefined) {
//                 try {


//                     console.log("number ", number, course, last_msg)


//                     if (last_msg == "start_day_temp" || last_msg == "Let's Begin") {

//                         console.log("a. Sending reminder notification to ", number, course)

//                         // console.log(id)
//                         updateField(id, "Last_Msg", "reminder_template", studentTable)
//                         if (studentTable == "Student") {
//                             WA.sendReminder("start_day_reminder", number)
//                         }
//                         else if (studentTable == "Telegram-Students") {

//                             WA.sendTelegram_ReminderTemplate(startDay_reminder, number).then().catch(e => console.log("1. e ", e))
//                         }


//                         // }
//                     }
//                     else if (last_msg.includes("Congratulations on completing Day") || last_msg == "Start Course") {

//                         console.log("0. Sending START DAY notification", number, day, studentTable, course)

//                         updateField(id, "Last_Msg", "start_day_temp", studentTable).then().catch(e => console.log("2.0 e ", e))

//                         if (studentTable == "Student") {
//                             WA.sendTemplateMessage(day, course, "generic_course_template", number).then().catch(e => console.log("2. e ", e))
//                         }
//                         else if (studentTable == "Telegram-Students") {
//                             WA.sendTelegram_StartTemplate(day, number).then().catch(e => console.log("2. e ", e))
//                         }




//                     }

//                     else if (last_msg.includes("reminder_template") || last_msg == "document") {
//                         // console.log("3. title ", list)
//                         console.log("Do nothing")

//                     }


//                     else if (list.includes(last_msg) || last_msg == "Incorrect" || last_msg == "Alright, see you then!") {
//                         console.log("1. title ", list)
//                         console.log("0.4 Certificate - Sending REMINDER_TEMPLATE notification", number)
//                         // updateField(id, "Last_Msg", "reminder_template")
//                         if (studentTable == "Student") {
//                             // WA.sendReminder("reminder_message", number)
//                         }
//                         else if (studentTable == "Telegram-Students") {
//                             WA.sendTelegram_ReminderTemplate(reminder_message, number).then().catch(e => console.log("3. e ", e))
//                         }


//                     }
//                     else if (last_msg.includes("What is your full name?")
//                         || last_msg.includes("What's your email address?")

//                     ) {
//                         console.log("0.3 Outroflow - Sending REMINDER_TEMPLATE notification", number, last_msg)

//                         WA.sendReminder("reminder_template", number)

//                     }
//                     else {
//                         // console.log("2. title ", list)
//                         console.log("4. Sending reminder notification no condition matched ", number, course)


//                         updateField(id, "Last_Msg", "reminder_template", studentTable)

//                         if (studentTable == "Student") {
//                             WA.sendReminder("reminder_message", number).then().catch(e => console.log(e))
//                         }
//                         else if (studentTable == "Telegram-Students") {
//                             WA.sendTelegram_ReminderTemplate(reminder_message, number).then().catch(e => console.log("4. e ", e))
//                         }


//                     }
//                 }


//                 catch (e) {
//                     console.error("sendContent error " + e)
//                 }
//             }
//             else {
//                 console.log(completed_Day)
//             }
//         }

//     })

// }


// const totalDays = async (number, studentTable, contact) => {
//     var course_tn = await findTable(number, studentTable, contact)

//     const course_table = await course_base(`${course_tn}`).select({
//         fields: ["Day"],
//         view: "Grid view"
//     }).all();
//     return new Promise((resolve, reject) => {
//         count = 0
//         course_table.forEach(function (record) {
//             count += 1

//         })
//         resolve(count)
//         // reject("Error")
//     })

// }
// const findTable = async (number, studentTable, contact) => {
//     const course_table = await base(`${studentTable}`).select({
//         filterByFormula: "({" + contact + "} = " + number + ")",
//         view: "Grid view"
//     }).all();

//     return new Promise((resolve, reject) => {
//         course_tn = ""
//         course_table.forEach(function (record) {
//             course_tn = record.get("Topic")
//             // console.log("2. course_tn ", course_tn)
//             resolve(course_tn)
//             // reject("error")

//         })
//     })
// }

// async function getID(contact, studentTable, number) {
//     // let course_tn = await findTable(number, studentTable, contact)
//     // console.log("getID course_tn ", course_tn)

//     return new Promise(async function (resolve, reject) {
//         const course_table = await base(studentTable).select({
//             filterByFormula: "({" + contact + "} = " + number + ")",
//             view: "Grid view"
//         }).all();

//         course_table.forEach(function (record) {


//             let id = record.id
//             // console.log("id", id)
//             resolve(id)
//             // reject("Error")
//         })
//     })

// }

// async function updateField(id, field_name, updatedValue, studentTable) {
//     // let course_tn = await findTable(studentTable)
//     base(studentTable).update([

//         {
//             "id": id,
//             "fields": {
//                 [field_name]: updatedValue
//             }
//         }
//     ], function (err, records) {
//         if (err) {
//             // throw new Error(err)
//             console.log(err);
//             // return;
//         }

//     });
// }

// const findTitle = async (currentDay, module_no, course, number) => {
//     // console.log("1. course_tn ")

//     // let course_tn = await findTable(number)
//     // console.log("1. course_tn ", currentDay, module_no)

//     const records = await course_base(course).select({
//         filterByFormula: "({Day} =" + currentDay + ")",
//         view: "Grid view",

//     }).all();
//     return new Promise((resolve, reject) => {
//         records.forEach(function (record) {
//             let title = record.get('Module ' + module_no + ' LTitle');
//             console.log(title)
//             // let options = record.get('Module ' + module_no + ' List');
//             if (title != undefined) {
//                 console.log("title not undefined")
//                 resolve(title)
//                 // reject("error")
//             }
//             else {

//                 resolve("")
//             }
//         })
//     })
// }

// getStudentNumbers("Student", "Phone")
// getStudentNumbers("Telegram-Students", "ChatID")
app.get('/cop', async (req, res) => {
    try {

        getStudentNumbers("Student", "Phone")
        // getStudentNumbers("Telegram-Students", "ChatID")


    }
    catch (e) {
        console.log("error " + e)
    }

    res.send("ok")
})

app.listen(process.env.PORT, () => {
    console.log(`Server is up and running at ${process.env.PORT}`);
});


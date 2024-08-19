//wati.js
var request = require('request');

const fetch = require('node-fetch');

require('dotenv').config("./env")

// const Promise = require('bluebird');
// Promise.config({
//     cancellation: false,
// });
// const TelegramBot = require('node-telegram-bot-api');

// require('dotenv').config("./env")
// const TOKEN = process.env.TOKEN;
// const bot = new TelegramBot(TOKEN);

// bot.Promise = Promise;

async function sendTelegram_StartTemplate(number) {
    return new Promise((resolve, reject) => {
        var templateMessage = `Hey! Welcome to *Web3: Intro To The Future by Ekatra.* 
        
This course will give you a holistic understanding about the basics of Web 3 and an edge over others. We will build a reliable foundation of knowledge about web 3, the future of the Internet. `
        const opts = {
            reply_markup: {
                inline_keyboard: [[
                    {
                        text: "Start Day",
                        callback_data: 'Start Day'
                    }
                ]],
                one_time_keyboard: true,
                resize_keyboard: true

            },
            parse_mode: 'Markdown'
        };
        bot.sendMessage(number, templateMessage, opts);
        // console.log(res)
        resolve("ok")
        reject(number)

    })
}

async function sendTelegram_ReminderTemplate(text, number) {
    return new Promise((resolve, reject) => {
        var templateMessage = text
        const opts = {

            one_time_keyboard: true,
            resize_keyboard: true,


            parse_mode: 'Markdown'
        };
        bot.sendMessage(number, templateMessage, opts);
        // console.log(res)
        resolve("ok")
        reject(number)

    })
}

const getMessages = async (senderID, at) => {
    return new Promise((resolve, reject) => {
        var options = {
            'method': 'GET',
            'url': `https://${process.env.URL}/api/v1/getMessages/${senderID}`,
            'headers': {
                'Authorization': process.env.API
            },
            formData: {
                'pageSize': '10',
                'pageNumber': '1'
            }
        };
        request(options, function (error, response) {
            if (error) console.log(error);
            at = Number(at)

            result = JSON.parse(response.body)
            // console.log(result.messages.items[at])
            // last_text = result.messages.items[0].text
            resolve(result.messages.items[at])
            //resolve(result.messages.items[at].text);

        });
    })
}

async function sendReminder(template_name, senderID) {
    let options = {
        'method': 'POST',
        'url': `https://${process.env.URL}/api/v1/sendTemplateMessage?whatsappNumber=${senderID}`,
        'headers': {
            'Authorization': process.env.API,
            'content-type': 'application/json-patch+json'
        },
        body: JSON.stringify({
            "template_name": "reminder_message",
            "broadcast_name": "test",
            "parameters": [
               
            ]
        })

    };
    console.log(options.url)
    request(options, function (error, response) {
        if (error) { console.log("Error in reminder template ", error) };
        console.log("Reminder Status ", response.statusCode);
        return response.statusCode
    });
    
   
}
// sendReminder("reminder_message", "918779171731")

// async function sendTemplateMessage(day, studentName, number) {
    

//     const url = 'https://' + process.env.URL + '/api/v1/sendTemplateMessage?whatsappNumber=' + number;
//     const bodyData = {
//         template_name: "hester001",
//         broadcast_name: "test",
//         parameters: [
//             { name: "day", value: day },
//             { name: "name", value: studentName }
//         ]
//     };
//     const options = {
//         method: 'POST',
//         headers: {
//             'content-type': 'application/json-patch+json',
//             Authorization: process.env.API
//         },
//         body: bodyData
//     };

//     fetch(url, options)
//         .then(res => res.json())
//         .then(json => console.log(json))
//         .catch(err => console.error('error:' + err));
// }

async function sendTemplateMessage(day, course_name, senderID) { 
    let options = {
        'method': 'POST',
        'url': `https://${process.env.URL}/api/v1/sendTemplateMessage?whatsappNumber=${senderID}`,
        'headers': {
            'Authorization': process.env.API,
            'content-type': 'application/json-patch+json'
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
    request(options, function (error, response) {
        if (error) {console.log("Error in sending template ", error)};
        console.log("Start Day Status ", response.statusCode);
        return response.statusCode

    });
}

// async function sendTemplateMessage(day, template_name, student_name, senderID) {
//     console.log(day, template_name, senderID )
//     params = [{ 'name': "day", "value": day }, {"name":"name", "value":student_name}]
//     var options = {
//         'method': 'POST',
//         'url': 'https://' + process.env.URL + '/api/v1/sendTemplateMessage/' + senderID,
//         'headers': {
//             'Authorization': process.env.API,
//             'Content-Type': 'application/json',
//         },
//         body: JSON.stringify({
//             "template_name": template_name,
//             "broadcast_name": template_name,
//             "parameters": JSON.stringify(params)
//         })

//     };
//     request(options, function (error, response) {
//         body = JSON.parse(response.body)
//         result = body.result
        
//         if (error || result == false)
//             console.log("WATI error " + response.body)

//         console.log("Res " + result);
//     });
// }

// sendTemplateMessage(4,  "Ramsha", 918779171731) 
module.exports = {
    sendTemplateMessage,
    sendReminder,
    getMessages,
    sendTelegram_ReminderTemplate,
    sendTelegram_StartTemplate
}


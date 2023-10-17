const venom = require('venom-bot');
const express = require('express');
const app = express();
const port = process.env.PORT || 3001;
const http = require("http");
const server = http.createServer(app);
const puppeteer = require('puppeteer')
// console.log(puppeteer.executablePath(), 'path');
const {
    Server
} = require("socket.io");
const { executablePath } = require('./.puppeteerrc.cjs');
const io = new Server(server, {
    cors: {
        origin: '*',
        methods: ['GET', 'POST'],
    },
});

server.listen(port, () => {
    console.log('running at', port)
});

// INITIALIZE VARAIBLES

let allSessionObject = {};
let mediaBase64 = {};
let qrCounter = 0;
let scheduleMessagePayload = {}
let sessionStatus = ""



app.get('/', (req, res) => {
    res.send('<h1>Node application</h1>');
});


const getWhatsappSession = (id, socket, reconnect) => {

    venom
        .create(
            //session
            id, //Pass the name of the client you want to start the bot
            //catchQR
            (base64Qrimg, asciiQR, attempts, urlCode) => {
                socket.emit("qr", {
                    qr: urlCode,
                    message: 'Client qr'
                })
                console.log('Number of attempts to read the qrcode: ', attempts);
                // console.log('Terminal qrcode: ', asciiQR);
                // console.log('base64 image string qrcode: ', base64Qrimg);
                console.log('urlCode (data-ref): ', urlCode);
            },
            // statusFind
            (statusSession, session) => {
                console.log('Status Session: ', statusSession); //return isLogged || notLogged || browserClose || qrReadSuccess || qrReadFail || autocloseCalled || desconnectedMobile || deleteToken || chatsAvailable || deviceNotConnected || serverWssNotConnected || noOpenBrowser || initBrowser || openBrowser || connectBrowserWs || initWhatsapp || erroPageWhatsapp || successPageWhatsapp || waitForLogin || waitChat || successChat
                //Create session wss return "serverClose" case server for close
                if (statusSession.trim().toLowerCase() == 'qrreadfail') {
                    socket.emit('qrcodeexpired', {
                        id: session,
                        message: "QR Code timed out, click the connect button to reconnect."
                    })
                }

                if (statusSession.trim().toLowerCase() == 'erropagewhatsapp') {
                    socket.emit('whatsapperror', {
                        id: session,
                        message: "Authentication failed due to network connectivity, please ensure you have a strong and stable network and try again."
                    })
                }

                sessionStatus = statusSession.trim().toLowerCase()
                if (statusSession.trim().toLowerCase() == 'waitforlogin') {
                    socket.emit('readytoserve', {
                        message: 'You can connect now, clicking the connect button below'
                    })
                }
            },
            // Path download Chrome: /home/site/wwwroot/chrome/chrome-win.zip
            // options
            {
                // browserPathExecutable: puppeteer.executablePath(), // browser executable path
                // folderNameToken: 'tokens', //folder name when saving tokens
                // mkdirFolderToken: '', //folder directory tokens, just inside the venom folder, example:  { mkdirFolderToken: '/node_modules', } //will save the tokens folder in the node_modules directory
                // headless: 'new', // you should no longer use boolean false or true, now use false, true or 'new' learn more https://developer.chrome.com/articles/new-headless/
                // devtools: false, // Open devtools by default
                // debug: false, // Opens a debug session
                // logQR: true, // Logs QR automatically in terminal
                // browserWS: '', // If u want to use browserWSEndpoint
                // args:[ '--no-sandbox', '--disable-setuid-sandbox' ], // Original parameters  ---Parameters to be added into the chrome browser instance
                // addBrowserArgs: [''], // Add broserArgs without overwriting the project's original
                // puppeteerOptions: { headless: 'new', executablePath: 'usr/bin/google-chrome' }, // Will be passed to puppeteer.launch
                // disableSpins: true, // Will disable Spinnies animation, useful for containers (docker) for a better log
                // disableWelcome: true, // Will disable the welcoming message which appears in the beginning
                updatesLog: false, // Logs info updates automatically in terminal
                autoClose: 120000, // Automatically closes the venom-bot only when scanning the QR code (default 60 seconds, if you want to turn it off, assign 0 or false)
                // createPathFileToken: false, // creates a folder when inserting an object in the client's browser, to work it is necessary to pass the parameters in the function create browserSessionToken
                // addProxy: [''], // Add proxy server exemple : [e1.p.webshare.io:01, e1.p.webshare.io:01]
                // userProxy: '', // Proxy login username
                // userPass: '' // Proxy password
            },
            // BrowserInstance
            (browser, waPage) => {
                console.log('Browser PID:', browser.process().pid);
                waPage.screenshot({ path: 'screenshot.png' });
            }
        )
        .then((client) => {
            // Catch ctrl+C
            process.on('SIGINT', function() {
                console.log('client closed');
                client.close();
            });
            
            // Try-catch close
            try {
                start(client, id, socket, reconnect);
            } catch (error) {
                console.log(error, 'error with client, closing client');
                client.close();
            }
        })
        .catch((erro) => {
            console.log(erro);
        });
}



function start(client, id, socket, reconnect) {
    console.log('Client is ready!');
    allSessionObject[id] = client
    socket.emit("ready", {
        id,
        message: "client is ready"
    })
    getAllChats(client, socket, id);

    if (reconnect == 'reconnect') {
        console.log('ready and reconnected');
        console.log(Message, WhatsappAttachment, SessionId, ChatRecipients, GroupRecipients, Base64File, 'destructured')
        if (scheduleMessagePayload[id] && scheduleMessagePayload[id].ChatRecipients && scheduleMessagePayload[id].ChatRecipients.length > 0) {
            let { Message, WhatsappAttachment, SessionId, ChatRecipients, GroupRecipients, Base64File } = scheduleMessagePayload[id]
            sendScheduledMessage(Message, WhatsappAttachment, SessionId, ChatRecipients, GroupRecipients, Base64File, socket)
        }
    }
    // client.onMessage((message) => {
    //   if (message.body === 'Hi' && message.i sGroupMsg === false) {
    // client
    //   .sendText('2349033246067@c.us', 'Welcome Venom 🕷')
    //   .then((result) => {
    //     console.log('Result: ', result); //return object success
    //   })
    //   .catch((erro) => {
    //     console.error('Error when sending: ', erro); //return object error
    //   });
    //   }
    // });
}


async function sendMessage(chatId, message, whatsappAttachment, client, id, name, socket) {
    if (client) {
        if (message.includes("#name#")) {
            message = message.replaceAll("#name#", name ? name : "")
        }
        // If a file is attached
        if (whatsappAttachment.mimeType) {
            // if image
            if (whatsappAttachment.mimeType.includes('image')) {
                await client.sendImageFromBase64(chatId, mediaBase64[id], whatsappAttachment.fileName, message)
                    .then(() => {
                        console.log('message sent with image')
                    }).catch(err => {
                        console.log(err.text, chatId, 'err');
                    })
            } else if (whatsappAttachment.mimeType.includes('audio')) {
                await client.sendVoiceBase64(chatId, mediaBase64[id])
                    .then(() => {
                        console.log('message sent with audio')
                        if (message) {
                            messageText(chatId, message, client)
                        }
                    }).catch(err => {
                        console.log(err.text, chatId, 'err');
                    })
            } else {
                await client.sendFileFromBase64(chatId, mediaBase64[id], whatsappAttachment.fileName, message)
                    .then(() => {
                        console.log('message sent with file')
                    }).catch(err => {
                        console.log(err.text, chatId, 'err');
                    })
            }
        } else {
            // If no file is attached
            messageText(chatId, message, client)
        }
    } else {
        console.log('client is not defined');
        getWhatsappSession(id, socket, 'reconnect')
        socket.emit('reconnectclient', {
            id,
            message: 'Client got disconnected, attempting to reconnect ...'
        })
    }

}

// ------------------------------------------------------------------------------------------
// send text

async function messageText(chatId, message, client) {
    await client.sendText(chatId, message).then(() => {
        console.log('message sent')
    }).catch(err => {
        console.log(err.text, chatId, 'err');
    })
}



// ------------------------------------------------------------------------------------------
// send schedule message

function sendScheduledMessage(Message, WhatsappAttachment, SessionId, ChatRecipients, GroupRecipients, Base64File, socket) {
    let whatsappAttachment = {
        mimeType: WhatsappAttachment.MimeType,
        fileName: WhatsappAttachment.FileName,
        fileSize: WhatsappAttachment.FileSize
    }
    if (Base64File) {
        mediaBase64[SessionId] = Base64File
    }
    const client = allSessionObject[SessionId];

    // If sending to phone numbers
    if (ChatRecipients && ChatRecipients.length > 0) {
        ChatRecipients.forEach(item => {
            let number = item.phoneNumber.trim().replaceAll(" ", "") + "@c.us";
            if (number.substring(0, 1) == '+') {
                // If the number is frmated : +234xxxxxxxxxxxx
                const chatId = number.substring(1)
                sendMessage(chatId, Message, whatsappAttachment, client, SessionId, item.name, socket)
            } else {
                // If the number is formatted: 234xxxxxxxxxxxx
                const chatId = number
                sendMessage(chatId, Message, whatsappAttachment, client, SessionId, item.name, socket)
            }
        })
    }

    // If sending to groups
    if (GroupRecipients && GroupRecipients.length > 0) {
        GroupRecipients.forEach(group => {
            const groupId = group.trim().replaceAll(" ", "") + "@g.us";
            sendMessage(groupId, Message, whatsappAttachment, client, SessionId, socket)
        })
    }
}



// SOCKET CONNECTION

io.on('connection', (socket) => {
    console.log('user connected', socket.id);
    socket.emit('message', 'This is a test message from the server')
    socket.on('disconnect', () => {
        console.log('user disconnected');
    });
    socket.on('connected', () => {
        console.log('connected to the server')
        socket.emit('Hello', 'Hello form server')
    })

    socket.on('resetmediaobject', ({ data, id }) => {
        mediaBase64[id] = data
    })

    socket.on('chunk', ({ chunk, uploadedChunks, totalChunks, id }) => {
        mediaBase64[id] += chunk
        // if (mediaBase64[id]) {
        //     socket.emit('fileready')
        //     console.log('reaching here')
        // }
        console.log(id, 'checking');
        console.log("==");

        // // Calculate progress in percentage
        let chunkProgress = Math.ceil((uploadedChunks / totalChunks) * 100);
        console.log(`Progress: ${chunkProgress}%`);
        socket.emit('chunkprogress', chunkProgress)
    })

    socket.on('clearfile', ({ data, id }) => {
        mediaBase64[id] = data
    })

    socket.on('getsession', (data) => {
        console.log('GET_SESSION_ID_1', data)
        const {
            id
        } = data
        console.log(sessionStatus);
        if (sessionStatus) {
            if (sessionStatus == 'waitforlogin' || sessionStatus == 'successchat' || sessionStatus == 'erropagewhatsapp' || sessionStatus == 'islogged' || sessionStatus == 'noopenbrowser') {
                console.log('ready to serve login request');
                sessionStatus = ""
                getWhatsappSession(id, socket, '')
            } else {
                console.log('Processing for a client');
                socket.emit('processing', {
                    message: "Currently authenticating a user, please wait ..."
                })
            }
        } else {
            getWhatsappSession(id, socket, '')
        }
    })


    socket.on('sendwhatsappmessage', ({
        id,
        phone_number,
        message,
        whatsappAttachment
    }) => {
        console.log('sending message')
        const client = allSessionObject[id];

        console.log(id, 'ID')
        console.log(phone_number, 'PHONENUMBER')
        console.log(whatsappAttachment, 'WhatsappAttachment')
        // getChatById(client, phone_number)

        throttleMessages(phone_number, message, whatsappAttachment, id, client, socket)


    })

    socket.on('sendtogroups', ({
        id,
        groups,
        message,
        whatsappAttachment
    }) => {
        const client = allSessionObject[id];
        console.log(groups)
        console.log(whatsappAttachment)
        groups.forEach(group => {
            const groupId = group.trim().replaceAll(" ", "") + "@g.us";
            sendMessage(groupId, message, whatsappAttachment, client, id, null, socket)
        })
    })

    socket.on('sendscheduledwhatsappmessage', ({ Message, WhatsappAttachment, SessionId, ChatRecipients, GroupRecipients, Base64File }) => {
        console.log({ Message, WhatsappAttachment, SessionId, ChatRecipients, GroupRecipients, Base64File });
        scheduleMessagePayload[SessionId] = { Message, WhatsappAttachment, SessionId, ChatRecipients, GroupRecipients, Base64File }
        // socket.emit('schedulepayload', { Message, WhatsappAttachment, SessionId, ChatRecipients, GroupRecipients, Base64File })
        sendScheduledMessage(Message, WhatsappAttachment, SessionId, ChatRecipients, GroupRecipients, Base64File, socket)
    })
    

    // socket.on('deleteremotesession' , async({ session }) => {
    //     console.log(store, session);
    //     try {
    //         // let data = await store.delete({ session });
    //         const mongoConn = mongoose.connection;
    //        let data = await mongoConn.collection('test').deleteOne({ _id: session });
    //         console.log(data, 'ssss');
    //     } catch (error) {
    //         console.error(error);
    //     }

    // })
});


const throttleMessages = (phone_number, message, whatsappAttachment, id, client, socket) => {
    let full_phone_number = phone_number
    let sliced_phone_number = []
    if (full_phone_number.length > 10) {
        sliced_phone_number = full_phone_number.slice(0, 10)
        full_phone_number.splice(0, 10)
    } else {
        sliced_phone_number = full_phone_number
        full_phone_number = []
    }
    sliced_phone_number.forEach((item, index) => {
        let number = item.phoneNumber.trim().replaceAll(" ", "") + "@c.us";
        if (number.substring(0, 1) == '+') {
            // If the number is frmated : +234xxxxxxxxxxxx
            const chatId = number.substring(1)
            sendMessage(chatId, message, whatsappAttachment, client, id, item.name, socket)
        } else {
            // If the number is formatted: 234xxxxxxxxxxxx
            const chatId = number
            sendMessage(chatId, message, whatsappAttachment, client, id, item.name, socket)
        }
        if (index == sliced_phone_number.length - 1) {
            setTimeout(() => {
                if (full_phone_number.length > 0) {
                    throttleMessages(full_phone_number, message, whatsappAttachment, id, client, socket)
                } else {
                    console.log('All messages sent');
                }
            }, 10000);
        }
    })
    socket.emit('messagesent', {
        status: 200,
        message: 'Message sent successfully',
    })
}

// ============================================================================================
//   CUSTOM FUNCTIONS AND WHATSAPP API METHODS CALL
// --------------------------------------------------------------------------------------------
// GET ALL CHATS

const getAllChats = async (client, socket, id) => {
    try {
        const chats = await client.getAllChatsGroups();
        socket.emit('allchats', {
            id,
            chats,
            message: 'Here are all chats'
        })
    }
    catch (error) {
        console.error(error);
    }
    // const chats = await client.pupPage.evaluate(async () => {
    //     const chats = await window.WWebJS.getChats();
    // return chats
    // })
}
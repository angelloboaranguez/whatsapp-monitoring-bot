const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const axios = require('axios');
const fs = require('fs');

const urlCheck = "https://www.example.com"
const countryCode = "34"
const targetNumber = "666666666"
const chatId = countryCode + targetNumber + "@c.us"
const checkInterval = 300000

let isPreviousError = false;

const SESSION_FILE_PATH = './sessions';

// Load the session data if it has been previously saved
let sessionData;

//if(fs.existsSync(SESSION_FILE_PATH)) {
//    sessionData = require(SESSION_FILE_PATH);
//}

const client = new Client({
	authStrategy: new LocalAuth({ dataPath: SESSION_FILE_PATH }),
	puppeteer: {
		args: [
			'--no-sandbox',
			'--disable-setuid-sandbox',
			'--disable-extensions',
			'--disable-gpu',
			'--disable-accelerated-2d-canvas',
			'--no-first-run',
			'--no-zygote',
			'--disable-dev-shm-usage'
		],
		headless: true
	}
});

// Save session values to the file upon successful auth
//client.on('authenticated', (session) => {
//	console.log("Authenticated session 1:", JSON.stringify(session));
//	console.log("Authenticated session 2:", session)
//	if (session){
//		sessionData = session;
//		fs.writeFile(SESSION_FILE_PATH, JSON.stringify(session), (err) => {
//			if (err) {
//				console.error(err);
//			}
//		});
//	}
//});

client.on('qr', qr => {
    console.log('Generating QR Code for new connection...');
    qrcode.generate(qr, {small: true});
});

client.on('ready', () => {
    console.log('Client is ready!');
	
	// Comenzar la comprobación cada 5 minutos (300,000 milisegundos).
	setInterval(() => { checkUrlStatus(urlCheck) }, checkInterval);
});

client.on('message', msg => {
    if (msg.body == '!ping') {
        msg.reply('pong');
    }
});

client.on('loading_screen', (percent, message) => {
    console.log('LOADING SCREEN', percent, message);
});

client.on('authenticated', () => {
    console.log('AUTHENTICATED');
});

client.on('auth_failure', msg => {
    // Fired if session restore was unsuccessful
    console.error('AUTHENTICATION FAILURE', msg);
});

client.on('disconnected', (reason) => {
    console.log('Client was logged out', reason);
});

client.initialize();

function notifyError() {
    // Aquí implementa la lógica para notificar del error.
    console.log("¡Error! El código de estado HTTP es un error.");
	
	client.sendMessage(chatId, message).then(response => {
		if (response.fromMe) {
			//console.log("Mensaje enviado")
		}
	})
}

function checkUrlStatus(url) {
	console.log("Running status check for: " + url)
	console.log("Sending notifications to: " + chatId)
	if (chatId) {
		axios.get(url)
		.then(response => {
			console.log("Status:", response.status)
			if (response.status >= 400) {
				if (!isPreviousError) {
					// Notificar solo si el estado cambia de no erróneo a erróneo.
					notifyError();
				}
			}
			isPreviousError = response.status >= 400;
		})
		.catch(error => {
			if (!isPreviousError) {
				// Notificar solo si el estado cambia de no erróneo a erróneo.
				notifyError();
			}
			isPreviousError = true;
		});
	}
}

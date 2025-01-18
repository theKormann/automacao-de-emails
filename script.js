const fs = require('fs');
const csv = require('csv-parser');
const nodemailer = require('nodemailer');

// Configuração do transporte de e-mail
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: 'seu-email@gmail.com', // Substitua pelo seu e-mail
    pass: 'sua-senha-app',       // Substitua pela senha do aplicativo
  },
});

// Função para gerar o texto simples do e-mail
const generateText = (recipientName, customMessage) => {
  return `
Olá ${recipientName},

${customMessage}

Atenciosamente,
Sua Equipe
  `;
};

// Função para gerar o HTML do e-mail
const generateHtml = (recipientName, customMessage) => {
  return `
    <p>Olá <strong>${recipientName}</strong>,</p>
    <p>${customMessage}</p>
    <p>Atenciosamente,<br>Sua Equipe</p>
  `;
};

// Função para enviar e-mails com anexos
const sendEmailWithAttachment = async (emailData, attachments) => {
  return new Promise((resolve, reject) => {
    transporter.sendMail({
      ...emailData,
      attachments: attachments,
    }, (error, info) => {
      if (error) {
        reject(`Erro ao enviar e-mail para ${emailData.to}: ${error}`);
      } else {
        resolve(`E-mail enviado para ${emailData.to}: ${info.response}`);
      }
    });
  });
};

// Função para processar o arquivo CSV
const processCSV = async (inputFilePath, outputFilePath, attachments, intervalTime = 5000) => {
  const noEmailData = [];
  const rows = [];

  fs.createReadStream(inputFilePath)
    .pipe(csv())
    .on('data', (row) => {
      rows.push(row);
    })
    .on('end', async () => {
      for (let i = 0; i < rows.length; i++) {
        const row = rows[i];
        const recipientName = row['recipientName'];
        const email = row['email'];
        const customMessage = row['message'];

        const message = generateText(recipientName, customMessage);
        const htmlMessage = generateHtml(recipientName, customMessage);

        if (email) {
          await new Promise(resolve => setTimeout(resolve, i * intervalTime));
          try {
            await sendEmailWithAttachment({
              from: 'seu-email@gmail.com',
              to: email,
              subject: 'Mensagem Importante',
              text: message,
              html: htmlMessage,
            }, attachments);
            console.log(`E-mail enviado para ${recipientName}`);
          } catch (error) {
            console.error(error);
          }
        } else {
          noEmailData.push({ Recipient: recipientName, Message: message });
        }
      }

      if (noEmailData.length > 0) {
        const outputData = 'Recipient,Message\n' + noEmailData.map(row => `${row.Recipient},"${row.Message.replace(/\n/g, ' ')}"`).join('\n');
        fs.writeFileSync(outputFilePath, outputData);
        console.log(`Arquivo gerado com destinatários sem e-mail: ${outputFilePath}`);
      }
    })
    .on('error', (error) => {
      console.error('Erro ao processar o arquivo CSV:', error);
    });
};

// Caminhos dos arquivos e anexos
const inputFilePath = 'path/para/seu-arquivo.csv'; // Substitua pelo caminho do seu CSV
const outputFilePath = 'path/para/arquivo-output.csv'; // Substitua pelo caminho de saída
const attachments = [
  {
    filename: 'arquivo1.png',
    path: 'path/para/arquivo1.png',
  },
  {
    filename: 'arquivo2.png',
    path: 'path/para/arquivo2.png',
  },
];

// Processar o arquivo CSV
processCSV(inputFilePath, outputFilePath, attachments);

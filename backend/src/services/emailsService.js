const nodemailer = require('nodemailer');
const util = require('util');

// Validate required environment variables
function validateEnvVars() {
  const requiredEnvVars = [
    'SMTP_SERVER',
    'SMTP_PORT',
    'SMTP_SECURE',
    'SMTP_USER',
    'SMTP_USER_PASSWORD',
    'BASE_URL',
  ];

  const missingVars = requiredEnvVars.filter((varName) => !process.env[varName]);

  if (missingVars.length > 0) {
    throw new Error(`Missing required environment variables: ${missingVars.join(', ')}`);
  }

  if (isNaN(parseInt(process.env.SMTP_PORT, 10))) {
    throw new Error('SMTP_PORT must be a valid number.');
  }

  if (process.env.SMTP_SECURE !== 'true' && process.env.SMTP_SECURE !== 'false') {
    throw new Error('SMTP_SECURE must be "true" or "false".');
  }
}

// validation
validateEnvVars();

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_SERVER,
  port: parseInt(process.env.SMTP_PORT, 10),
  secure: process.env.SMTP_SECURE === 'true',
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_USER_PASSWORD,
  },
});

const sendMailAsync = util.promisify(transporter.sendMail.bind(transporter));


// Send confirmation email
async function sendConfirmationEmail(email, token) {
  const confirmationLink = `${process.env.BASE_URL}/confirm-email?token=${token}`;
  const mailOptions = {
    from: process.env.EMAIL_FROM,
    to: email,
    subject: 'Email Confirmation',
    text: `Please confirm your email by clicking on the following link: ${confirmationLink}`,
    html: `<p>Please confirm your email by clicking on the following link:</p>
           <a href="${confirmationLink}">${confirmationLink}</a>`,
  };

  try {
    const info = await sendMailAsync(mailOptions);
    return info;
  } catch (error) {
    console.error('Error sending confirmation email:', error);
    throw error;
  }
}

const sendEmail = async ({ to, subject, html }) => {
  const mailOptions = {
    from: process.env.EMAIL_NO_REPLY,
    to,
    subject,
    html,
  };

  return transporter.sendMail(mailOptions);
};

module.exports = {
  sendConfirmationEmail,
  sendEmail
};

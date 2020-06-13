const nodemailer = require('nodemailer');
const config = require('../../config');
const Email = require('email-templates');
const transporter = nodemailer.createTransport(config.email);

const emailSender = new Email({
  message: {
    from: config.email_sender,
  },
  send: true,
  transport: transporter,
});

const sendPasswordReset = (data) => {
  // transporter.template
  emailSender
    .send({
      template: 'default',
      message: {
        to: data.email,
      },
      locals: {
        subject: 'Password Reset Request',
        preHeaderText: '',
        headerText: 'Hi, ' + data.name + '!',
        paragraph1:
          'Someone requested that the password be reset for the following account: ' +
          data.email +
          '.',

        paragraph2: 'To reset your password, please press the button below.',
        ctaLink: data.tokenUrl,
        ctaText: 'Reset Password',
        paragraph3: `If that doesn't work, copy and paste the following link in your browser:`,
        paragraph4: 'If this was a mistake, just ignore this email and nothing will happen.',
      },
    })
    .then((res) => {
      return true;
    })
    .catch((err) => {
      return false;
    });
};

const sendActivationEmail = (data) => {
  // transporter.template
  emailSender
    .send({
      template: 'default',
      message: {
        to: data.email,
      },
      locals: {
        subject: 'Verify Your Email Account',
        preHeaderText: '',
        headerText: 'Hi, ' + data.name + '!',
        paragraph1: 'You need to validate your email to activate account: ',
        paragraph2: 'To validate your email, please press the button below.',
        ctaLink: data.tokenUrl,
        ctaText: 'Confirm Your Email',
      },
    })
    .then((res) => {
      return true;
    })
    .catch((err) => {
      return false;
    });
};

module.exports = { sendPasswordReset, sendActivationEmail };

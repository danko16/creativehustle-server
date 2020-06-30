const nodemailer = require('nodemailer');
const config = require('../../config');
const Email = require('email-templates');
const transporter = nodemailer.createTransport(config.email);

const emailSender = new Email({
  message: {
    from: '"Creative Hustle Info" no-reply@creativehustle.id',
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
        subject: 'Silahkan Verifikasi Emailmu',
        preHeaderText: '',
        headerText: 'Hi, ' + data.name + '!',
        paragraph1:
          'validasi informasi adalah kunci penting dalam melakukan pembelajaran secara online jadi ',
        paragraph2: 'pastikan kamu memverivikasi emailmu',
        ctaLink: data.tokenUrl,
        ctaText: 'Konfirmasi Emailmu',
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

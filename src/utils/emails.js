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
        subject: 'Permintaan Reset Password',
        preHeaderText: '',
        headerText: 'Hi, ' + data.name + '!',
        paragraph1: 'Seseorang telah meminta reset password untuk akun ini: ' + data.email + '.',
        paragraph2: 'untuk mereset password anda silahkan klik tombol di bawah ini.',
        ctaLink: data.tokenUrl,
        ctaText: 'Reset Password',
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

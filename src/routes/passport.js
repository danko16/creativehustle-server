const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth').OAuth2Strategy;
const { students: Student } = require('../models');
const { encrypt } = require('../utils/token');

const GOOGLE_CLIENT_ID = '446876581165-pbgrvmc4drv4jh81pp3dck34qgom2rac.apps.googleusercontent.com';
const GOOGLE_CLIENT_SECRET = 'L8pHU_jxJfC1BIJeA-Xz8rI5';

function generatePassword() {
  var length = 8,
    charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789',
    retVal = '';
  for (var i = 0, n = charset.length; i < length; ++i) {
    retVal += charset.charAt(Math.floor(Math.random() * n));
  }
  return retVal;
}

passport.use(
  new GoogleStrategy(
    {
      clientID: GOOGLE_CLIENT_ID,
      clientSecret: GOOGLE_CLIENT_SECRET,
      callbackURL: 'http://localhost:3000/auth/google/callback',
    },

    function (accessToken, refreshToken, profile, done) {
      Student.findOne({ where: { email: profile._json.email } })
        .then((student) => {
          if (student) {
            student.update({ last_login: Date.now(), is_active: true });
            return done(null, student);
          }
          const password = generatePassword();
          Student.create(
            Object.freeze({
              full_name: profile._json.name,
              email: profile._json.email,
              password: encrypt(password),
              is_active: true,
              last_login: Date.now(),
              provider: 'google',
            })
          ).then((createUser) => {
            return done(null, createUser);
          });
        })
        .catch((err) => {
          return done(err, null);
        });
    }
  )
);

passport.serializeUser(function (user, done) {
  done(null, user);
});

passport.deserializeUser(function (user, done) {
  done(null, user);
});

module.exports = passport;

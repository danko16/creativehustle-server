const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth').OAuth2Strategy;
const { students: Student, digital_assets: Asset } = require('../models');
const { encrypt } = require('../utils/token');
const config = require('../../config');

const GOOGLE_CLIENT_ID = config.googleId;
const GOOGLE_CLIENT_SECRET = config.googleSecret;

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
      callbackURL: `${config.serverDomain}/auth/google/callback`,
    },

    async function (accessToken, refreshToken, profile, done) {
      try {
        let student = await Student.findOne({
          where: { email: profile._json.email },
          include: [
            {
              model: Asset,
              as: 'student_assets',
              where: {
                type: 'avatar',
              },
              required: false,
            },
          ],
        });

        if (student) {
          await student.update({
            last_login: Date.now(),
            is_active: true,
          });

          if (student.student_assets.length < 1) {
            await Student.create(
              {
                student_assets: {
                  url: profile._json.picture,
                  type: 'avatar',
                },
              },
              { include: { model: Asset, as: 'student_assets' } }
            );
          }
        } else {
          const password = generatePassword();
          const createPayload = Object.freeze({
            full_name: profile._json.name,
            email: profile._json.email,
            password: encrypt(password),
            is_active: profile._json.email_verified,
            last_login: Date.now(),
            provider: 'google',
            student_assets: {
              url: profile._json.picture,
              type: 'avatar',
            },
          });

          await Student.create(createPayload, { include: { model: Asset, as: 'student_assets' } });
        }

        student = await Student.findOne({
          where: { email: profile._json.email },
          include: [
            {
              model: Asset,
              as: 'student_assets',
              where: {
                type: 'avatar',
              },
              required: false,
            },
          ],
        });

        return done(null, student);
      } catch (err) {
        return done(err, null);
      }
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

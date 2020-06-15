const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth').OAuth2Strategy;
const { students: Student, assets: Asset } = require('../models');
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
      callbackURL: 'https://api.creativehustle.id/auth/google/callback',
    },

    async function (accessToken, refreshToken, profile, done) {
      try {
        let student = await Student.findOne({
          where: { email: profile._json.email },
          include: [
            {
              model: Asset,
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

          if (student.assets.length < 1) {
            await Asset.create({
              url: profile._json.picture,
              type: 'avatar',
              uploadable_type: 'students',
              uploadable_id: student.id,
            });
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
          });

          const createStudent = await Student.create(createPayload);
          await Asset.create({
            url: profile._json.picture,
            type: 'avatar',
            uploadable_type: 'students',
            uploadable_id: createStudent.id,
          });
        }

        student = await Student.findOne({
          where: { email: profile._json.email },
          include: [
            {
              model: Asset,
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

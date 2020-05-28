require('module-alias/register');
const jwt = require('jsonwebtoken');
const CryptoJS = require('crypto-js');
const aes = require('crypto-js/aes');
const config = require('@config');

exports.isAllow = async (req, res, next) => {
  const token = req.headers['x-token'].split(' ')[1];
  if (!token) {
    res.status(401).json({ status: 401, message: 'Sorry, Authentication required! :(' });
  } else {
    //check token
    let decrypted = aes.decrypt(token, config.aessecret);
    await jwt.verify(decrypted.toString(CryptoJS.enc.Utf8), config.jwtsecret, function (
      err,
      decoded
    ) {
      if (err) res.status(401).json({ status: 401, message: 'Sorry, Authentication required! :(' });
      else next();
    });
  }
};

exports.parseUser = async (data) => {
  return {
    id: data._id,
    name: data.name,
    email: data.email,
    phone: data.phone,
  };
};

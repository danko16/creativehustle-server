require('module-alias/register');
const jwt = require('jsonwebtoken');
const CryptoJS = require('crypto-js');
const aes = require('crypto-js/aes');
const config = require('@config');

const isAllow = async (req, res, next) => {
  let token = req.headers['x-token'];
  if (!token) {
    return res.status(401).json({ status: 401, message: 'Sorry, Authentication required! :(' });
  } else {
    //check token
    token = token.split(' ')[1];
    if (!token) return res.status(401).json({ status: 401, message: 'Invalid Token!' });

    let decrypted = aes.decrypt(token, config.aessecret);
    await jwt.verify(decrypted.toString(CryptoJS.enc.Utf8), config.jwtsecret, function (
      err,
      decoded
    ) {
      if (err) return res.status(401).json({ status: 401, message: 'Invalid Jwt Token!' });
      else next();
    });
  }
};

const parseUser = async (data) => {
  return {
    id: data._id,
    name: data.name,
    email: data.email,
    phone: data.phone,
  };
};

module.exports = { isAllow, parseUser };

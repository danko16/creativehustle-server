require('module-alias/register');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const CryptoJS = require('crypto-js');
const aes = require('crypto-js/aes');
const config = require('@config');

exports.encrypt = (pass) => {
  const hash = crypto
    .createHmac('sha256', pass)
    .update('83hgo3gh93uqogy8o4bhg3qngo39gibg934nu')
    .digest('hex');
  return hash;
};

exports.getToken = async (payload) => {
  try {
    let token;
    if (payload.rememberMe) {
      token = await jwt.sign(payload, config.jwtsecret, { expiresIn: '4d' });
    } else {
      token = await jwt.sign(payload, config.jwtsecret, { expiresIn: '1d' });
    }
    return { pure: token, key: aes.encrypt(token, config.aessecret).toString() };
  } catch (error) {
    console.log(error);
    return null;
  }
};

exports.getRegisterToken = async (payload) => {
  try {
    let token = await jwt.sign(payload, config.jwtsecret, { expiresIn: '7d' });
    return aes.encrypt(token, config.aessecret).toString();
  } catch (error) {
    return null;
  }
};

exports.checkRegisterToken = async (token) => {
  try {
    let decrypted = CryptoJS.AES.decrypt(token, config.aessecret);
    let verified = await jwt.verify(
      decrypted.toString(CryptoJS.enc.Utf8),
      config.jwtsecret,
      function (err, decoded) {
        if (err) {
          return false;
        } else {
          if (decoded.for == 'register') return decoded;
          else return false;
        }
      }
    );
    return verified;
  } catch (error) {
    return false;
  }
};

exports.getTokenReset = async (payload) => {
  try {
    //Exp in 2 hours
    let token = await jwt.sign(payload, config.jwtsecret, { expiresIn: '2h' });
    let ciphertext = CryptoJS.AES.encrypt(token, config.aessecret);
    let decrypted = CryptoJS.AES.decrypt(ciphertext.toString(), config.aessecret);
    let nostring = decrypted.toString(CryptoJS.enc.Utf8);
    return nostring;
    // let token = await jwt.sign(payload, config.jwtsecret, { expiresIn: '2h' });
    // return aes.encrypt(token, config.aessecret).toString();
  } catch (error) {
    console.log(error);
    return null;
  }
};

exports.decryptToken = async (token) => {
  let decrypted = aes.decrypt(token, config.aessecret);
  let nostring = decrypted.toString(CryptoJS.enc.Utf8);
  return nostring.toString();
};

exports.checkTokenReset = async (token) => {
  try {
    let ciphertext = CryptoJS.AES.encrypt(token, config.aessecret);
    let decrypted = CryptoJS.AES.decrypt(ciphertext.toString(), config.aessecret);
    let verified = await jwt.verify(
      decrypted.toString(CryptoJS.enc.Utf8),
      config.jwtsecret,
      function (err, decoded) {
        if (err) {
          return false;
        } else {
          if (decoded.for == 'reset') return decoded;
          else return false;
        }
      }
    );
    return verified;
  } catch (error) {
    console.log(error);
    return false;
  }
};

exports.getPayload = async (token) => {
  try {
    let ciphertext = CryptoJS.AES.encrypt(token, config.aessecret);
    let decrypted = CryptoJS.AES.decrypt(ciphertext.toString(), config.aessecret);
    let nostring = decrypted.toString(CryptoJS.enc.Utf8);
    let verified = await jwt.verify(nostring.toString(), config.jwtsecret, function (err, decoded) {
      if (err) return false;
      else return decoded;
    });
    return verified;
  } catch (error) {
    console.log(error);
    return false;
  }
};
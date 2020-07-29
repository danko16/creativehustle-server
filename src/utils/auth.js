const jwt = require('jsonwebtoken');
const CryptoJS = require('crypto-js');
const aes = require('crypto-js/aes');
const { teachers: Teacher, students: Student } = require('../models');
const config = require('../../config');

const isAllow = async (req, res, next) => {
  let token = req.headers['x-token'];
  if (!token) {
    return res.status(401).json({ status: 401, message: 'Sorry, Authentication required! :(' });
  }
  try {
    token = token.split(' ')[1];
    if (!token) return res.status(401).json({ status: 401, message: 'Invalid Token!' });
    let decrypted = aes.decrypt(token, config.aessecret);

    const decoded = await jwt.verify(decrypted.toString(CryptoJS.enc.Utf8), config.jwtsecret);

    if (!decoded.type) {
      return res.status(401).json({ status: 401, message: 'User Type not Present!' });
    }

    let user;

    if (decoded.type === 'student') {
      user = await Student.findOne({ where: { id: decoded.uid } });
    } else if (decoded.type === 'teacher') {
      user = await Teacher.findOne({ where: { id: decoded.uid } });
      if (!user.approved) {
        return res.status(401).json({ status: 401, message: 'please wait for approval' });
      }
    } else if (decoded.type === 'admin') {
      user = await Teacher.findOne({ where: { id: decoded.uid } });
      if (!user.approved) {
        return res.status(401).json({ status: 401, message: 'please wait for approval' });
      }
    }

    if (!user) {
      return res.status(401).json({ status: 401, message: 'User not found!' });
    }
    res.locals.user = {
      id: user.id,
      type: decoded.type,
      email: user.email,
    };
    next();
  } catch (error) {
    return res.status(401).json({ status: 401, message: 'Something Wrong!', error });
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

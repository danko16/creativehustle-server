const socketAuth = require('socketio-auth');
const { decryptToken, getPayload } = require('./token');
const Students = require('@schema/students');
const Tutors = require('@schema/tutors');

const authenticate = async (socket, data, callback) => {
  if (!data) {
    return callback(new Error('unAuthorized request'));
  }
  try {
    const { key } = data;
    const token = await decryptToken(key);
    const jwt = await getPayload(token);

    let user;
    if (jwt.type === 'student') {
      user = await Students.findOne({ _id: jwt.uid });
    } else if (jwt.type === 'tutor') {
      user = await Tutors.findOne({ _id: jwt.uid });
    }

    if (!user) {
      return callback(new Error('user not found!'));
    }

    await user.updateOne({ is_online: true });

    return callback(null, user);
  } catch (error) {
    return callback(error);
  }
};

const postAuthenticate = async (socket, data) => {
  socket.client.key = data.key;
};

const disconnect = async (socket) => {
  if (socket.client.key) {
    const { key } = socket.client;
    const token = await decryptToken(key);
    const jwt = await getPayload(token);

    let user;
    if (jwt.type === 'student') {
      user = await Students.findOne({ _id: jwt.uid });
    } else if (jwt.type === 'tutor') {
      user = await Tutors.findOne({ _id: jwt.uid });
    }

    await user.updateOne({ is_online: false });
  }
};

module.exports = function (io) {
  socketAuth(io, {
    authenticate: authenticate,
    postAuthenticate: postAuthenticate,
    disconnect: disconnect,
    timeout: 1000,
  });
};

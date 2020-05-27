//Error Respond
exports.err400 = (msg) => {
  return { status: 400, message: msg || 'Bad request!' };
};
exports.err404 = (msg) => {
  return { status: 404, message: msg || 'Sorry, Nothing Found :(' };
};
exports.err401 = (msg) => {
  return { status: 401, message: msg || 'Sorry, Authentication required! :(' };
};
exports.err500 = (msg) => {
  return { status: 500, message: msg || `Ups! Internal Server Error :'(` };
};

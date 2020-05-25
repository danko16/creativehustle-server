const mongoose = require('mongoose');
const moment = require('moment');
const objectId = mongoose.Schema.Types.ObjectId;
const DateNow = moment().format('MM/DD/YYYY, HH:mm:ss');
const usersSchema = new mongoose.Schema(
  {
    full_name: { type: String, required: [true, 'full name is required'] },
    timezone: { type: String, default: null },
    credit_balance: { type: Number, default: 0 },
    email: { type: String, required: [true, 'email is required'] },
    password: { type: String, default: '' },
    package: { type: [objectId] },
    avatar: { type: String, default: null },
    is_active: { type: Boolean, default: false },
    is_online: { type: Boolean, default: false },
    created_date: { type: String, default: DateNow },
    updated_date: { type: String, default: DateNow },
    last_login: { type: String, default: null },
  },
  { collection: 'users' }
);
module.exports = mongoose.model('users', usersSchema);

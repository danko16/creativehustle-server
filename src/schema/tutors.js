const mongoose = require('mongoose');
const moment = require('moment');
const objectId = mongoose.Schema.Types.ObjectId;
const DateNow = moment().format('MM/DD/YYYY, HH:mm:ss');
const tutorsSchema = new mongoose.Schema(
  {
    full_name: { type: String, required: [true, 'full name is required'] },
    date_of_birth: { type: String, default: DateNow },
    gender: { type: Object, default: null },
    from: { type: Object, default: null },
    hear_from: { type: String, required: [true, 'where do you hear us from is required'] },
    living_in: { type: Object, default: null },
    timezone: { type: String, default: null },
    bridge_language: { type: Object, default: null },
    teach_language: { type: Object, default: null },
    credit_balance: { type: Number, default: 0 },
    appointment: { type: [objectId] },
    email: { type: String, required: [true, 'email is required'] },
    password: { type: String, default: '' },
    introduction: { type: String, default: '' },
    my_package: { type: [objectId] },
    bank_number: { type: String, default: '' },
    avatar: { type: Buffer, default: null },
    youtube_link: { type: String, default: null },
    is_approved: { type: Boolean, default: false },
    is_active: { type: Boolean, default: false },
    cv_link: { type: String, default: '' },
    motivation_link: { type: String, default: '' },
    is_accepting: { type: Boolean, default: true },
    created_date: { type: String, default: DateNow },
    updated_date: { type: String, default: DateNow },
    last_login: { type: String, default: null },
  },
  { collection: 'tutors' }
);
module.exports = mongoose.model('tutors', tutorsSchema);

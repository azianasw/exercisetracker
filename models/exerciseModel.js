const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const exerciseSchema = new Schema({
    description: { type: String, required: true },
    duration: { type: Number, required: true },
    date: { type: String, default: new Date(Date.now()).toDateString() }
});

module.exports = mongoose.model('exercise', exerciseSchema);
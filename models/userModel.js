const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const userSchema = new Schema({
    username: String,
    exercises: [{ type: Schema.Types.ObjectId, ref: 'exercise' }]
});

module.exports = mongoose.model('user', userSchema);
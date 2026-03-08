const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const userSchema = new Schema({
    userName:   {type: String, required: true, max: 100},
    userHead:   {type: String, required: true, max: 100},
    userBody: {type: String, required: true, max: 100},
    office:   {type: String, required: true, max: 100},
    position: {
        x: { type: Number, required: true },
        y: { type: Number, required: true },
        z: { type: Number, required: true }
    },
    rotation: {
        x: { type: Number, required: true },
        y: { type: Number, required: true },
        z: { type: Number, required: true }
    },
    timestamp: { type: Date, required: true }
});

const user = module.exports = mongoose.model('userData', userSchema);

module.exports.get = function (callback, limit) {
    user.find(callback).limit(limit);
}
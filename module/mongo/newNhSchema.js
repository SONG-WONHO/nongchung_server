const mongoose = require('mongoose');

const newNhSchema = new mongoose.Schema({
    idx: {type: Number, required: true, unique: true, index: true},
    data: Object,
});

module.exports = mongoose.model('NewNh', newNhSchema);
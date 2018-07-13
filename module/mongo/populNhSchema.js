const mongoose = require('mongoose');

const populNhSchema = new mongoose.Schema({
    idx: {type: Number, required: true, unique: true, index: true},
    data: Object,
});

module.exports = mongoose.model('PopulNh', populNhSchema);
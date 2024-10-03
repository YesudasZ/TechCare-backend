const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const reportSchema = new Schema({
    service:{
        type: Schema.Types.ObjectId,
        ref: 'Service',
        required: true
    },
    user:{
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    technician:{
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    description:{
        type: String,
        required: true
    },
    imageUrls:[{
        type: String
    }],
    status:{
        type: String,
        enum: ['pending', 'in-review', 'resolved'],
        default: 'pending'
    },
    createdAt:{
        type: Date,
        default: Date.now
    },
    updatedAt:{
        type: Date,
        default: Date.now
    }
});

const Report = mongoose.model("Report",reportSchema);

module.exports = Report;
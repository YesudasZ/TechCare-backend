const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const transactionSchema = new Schema({
    user:{
        type:Schema.Types.ObjectId,
        ref:"User",
        required:true
    },
    type:{
       type:String,
       enum:["credit","debit"],
       required:true
    },
    amount:{
        type:Number,
        required:true
    },
    description:{
        type:String,
        required:true
    },
    service:{
        type:Schema.Types.ObjectId,
        ref:"Service"
    },
    date:{
        type:Date,
        default:Date.now
    }
})

const walletSchema = new Schema({
    user:{
        type:Schema.Types.ObjectId,
        ref:"User",
        required:true,
        unique:true
    },
    balance:{
        type:Number,
        default:0
    },
    transactions:[{
        type:Schema.Types.ObjectId,
        ref:"Transaction"
    }],
    createdAt:{
        type:Date,
        default:Date.now
    },
    updatedAt:{
        type:Date,
        default:Date.now
    }
});

const Transaction = mongoose.model('Transaction', transactionSchema);
const Wallet = mongoose.model('Wallet', walletSchema);

module.exports = { Wallet, Transaction };
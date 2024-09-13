const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  firstName: { type: String, required: true },
  lastName: { type: String },
  email: { type: String, required: true},
  password: { type: String, required: true },
  phoneNumber: { type: Number },
  profilePicture: { type: String },
  role: { type: String, default: "user" },
  isVerified: { type: Boolean, default: false },
  isAuthorised: { type: Boolean, default: false },
  isProfileComplete: { type: Boolean, default: false },
  otp: { type: String },
  otpExpires: { type: Date },
  registrationNo: {type: String},
  aadharNo:{type:String},
  aadharPicture:{type:String},
  certificatePicture:{type:String},
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});
 
const User = mongoose.model("User", userSchema);

module.exports = User;  
const User = require("../models/User");
const { Wallet } = require("../models/Wallet.js");

const getAdminWallet = async () => {
  const admin = await User.findOne({ role: "admin" });
  if (!admin) {
    console.log("Admin user not found");
  }
  let adminWallet = await Wallet.findOne({ user: admin._id });
  if (!adminWallet) {
    adminWallet = new Wallet({ user: admin._id });
    await adminWallet.save();
    console.log("Admin wallet created");
  }
  return adminWallet;
};

module.exports = getAdminWallet;

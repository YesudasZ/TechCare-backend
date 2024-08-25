const User = require('../models/User.js'); 

const listUsers = async (req, res) => {
  try {
    const { page = 1, limit = 10, search = '' } = req.query;

    const query = {
      $or: [
        { firstName: { $regex: search, $options: 'i' } },
        { lastName: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
       
      ],
    };

    const users = await User.find(query)
      .skip((page - 1) * limit)
      .limit(Number(limit))
      .select('-password -otp -otpExpires') 
      .exec();

    const totalUsers = await User.countDocuments(query);

    res.status(200).json({
      users,
      totalPages: Math.ceil(totalUsers / limit),
      currentPage: Number(page),
      totalUsers,
    });
  } catch (error) {
    console.log(error.message);
    res.status(500).json({ message: 'Server error' });
  }
};

const toggleBlockUser = async (req, res) => {
  try {
    const { userId } = req.params;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    user.isVerified = !user.isVerified;
    await user.save();

    res.status(200).json({
      message: `User ${user.isVerified ? 'Blocked' : 'unblocked'} successfully`,
    });
  } catch (error) {
    console.log(error.message);
    res.status(500).json({ message: 'Server error' });
  }
};

const toggleAuthorizeTechnician = async (req, res) => {
  try {
    const { userId } = req.params;

    const user = await User.findById(userId);
    if (!user || user.role !== 'technician') {
      return res.status(404).json({ message: 'Technician not found' });
    }

    user.isAuthorised = !user.isAuthorised;
    await user.save();

    res.status(200).json({
      message: `Technician ${user.isAuthorised ? 'authorized' : 'unauthorized'} successfully`,
    });
  } catch (error) {
    console.log(error.message);
    res.status(500).json({ message: 'Server error' });
  }
};


module.exports = {
  listUsers,
  toggleBlockUser,
  toggleAuthorizeTechnician
};

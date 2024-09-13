const User = require("../models/User.js");
const ServiceCategory = require("../models/ServiceCategory.js");
const ServiceType = require("../models/ServiceType.js");
const cloudinary = require("../utils/cloudinary.js");

const listUsers = async (req, res) => {
  try {
    const { page = 1, limit = 10, search = "" } = req.query;

    const query = {
      $or: [
        { firstName: { $regex: search, $options: "i" } },
        { lastName: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
      ],
    };
  
    const users = await User.find(query)
      .skip((page - 1) * limit)
      .limit(Number(limit))
      .select("-password -otp -otpExpires")
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
    res.status(500).json({ message: "Server error" });
  }
};

const toggleBlockUser = async (req, res) => {
  try {
    const { userId } = req.params;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    user.isVerified = !user.isVerified;
    await user.save();

    res.status(200).json({
      message: `User ${user.isVerified ? "Blocked" : "unblocked"} successfully`,
    });
  } catch (error) {
    console.log(error.message);
    res.status(500).json({ message: "Server error" });
  }
};

const toggleAuthorizeTechnician = async (req, res) => {
  try {
    const { userId } = req.params;

    const user = await User.findById(userId);
    if (!user || user.role !== "technician") {
      return res.status(404).json({ message: "Technician not found" });
    }

    user.isAuthorised = !user.isAuthorised;
    await user.save();

    res.status(200).json({
      message: `Technician ${
        user.isAuthorised ? "authorized" : "unauthorized"
      } successfully`,
    });
  } catch (error) {
    console.log(error.message);
    res.status(500).json({ message: "Server error" });
  }
};
 
const createServiceCategory = async (req, res) => {
  try {
    const { name, videoUrl, imageUrl } = req.body;
    let uploadedVideo = null;
    let uploadedImages = [];

    if (videoUrl) {
      uploadedVideo = await cloudinary.uploader.upload(videoUrl, {
        resource_type: "video",
        folder: "techcare/service_category_videos",
      });
      console.log("Uploaded video:", uploadedVideo.secure_url);
    }

    if (imageUrl) {
      const imagesToUpload = Array.isArray(imageUrl) ? imageUrl : [imageUrl];

      for (let image of imagesToUpload) {
        try {
          const uploadedImage = await cloudinary.uploader.upload(image, {
            folder: "techcare/service_category_images",
          });
          uploadedImages.push(uploadedImage.secure_url);
          console.log("Uploaded image:", uploadedImage.secure_url);
        } catch (uploadError) {
          console.error("Error uploading image:", uploadError);
        }
      }
    } else {
      console.log("No images to process");
    }

    const serviceCategory = new ServiceCategory({
      name,
      videoUrl: uploadedVideo ? uploadedVideo.secure_url : null,
      imageUrl: uploadedImages,
    });

    console.log("Saving service category:", serviceCategory);

    await serviceCategory.save();

    console.log("Service category saved successfully");

    res.status(201).json({
      serviceCategory: serviceCategory,
      message: "Service category created successfully",
    });
  } catch (error) {
    console.error("Error in create service category", error);
    res.status(500).json({
      message: "Error creating service category",
      error: error.message,
    });
  }
};

const updateServiceCategory = async (req, res) => {
  try {
    const { name, videoUrl, imageUrl, deleteImages } = req.body;
    const serviceCategory = await ServiceCategory.findById(req.params.id);

    if (!serviceCategory) {
      return res.status(404).json({ message: "Service category not found" });
    }

    if (name) serviceCategory.name = name;

    if (videoUrl) {
      if (serviceCategory.videoUrl) {
        const publicId = serviceCategory.videoUrl
          .split("/")
          .pop()
          .split(".")[0];
        await cloudinary.uploader.destroy(publicId, { resource_type: "video" });
      }
      const uploadedVideo = await cloudinary.uploader.upload(videoUrl, {
        resource_type: "video",
        folder: "techcare/service_category_videos",
      });
      serviceCategory.videoUrl = uploadedVideo.secure_url;
    }

    if (deleteImages && deleteImages.length > 0) {
      for (let imageUrl of deleteImages) {
        const publicId = imageUrl.split("/").pop().split(".")[0];
        await cloudinary.uploader.destroy(publicId);
        serviceCategory.imageUrl = serviceCategory.imageUrl.filter(
          (url) => url !== imageUrl
        );
      }
    }

    if (imageUrl && imageUrl.length > 0) {
      const newImages = [];
      for (let image of imageUrl) {
        if (!image.startsWith("http")) {
          const uploadedImage = await cloudinary.uploader.upload(image, {
            folder: "techcare/service_category_images",
          });
          newImages.push(uploadedImage.secure_url);
        } else {
          newImages.push(image);
        }
      }

      serviceCategory.imageUrl = newImages;
    }

    serviceCategory.updatedAt = Date.now();
    await serviceCategory.save();
    res.status(200).json({
      serviceCategory: serviceCategory,
      message: "Service category updated successfully",
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const deleteServiceCategory = async (req, res) => {
  try {
    const serviceCategory = await ServiceCategory.findById(req.params.id);

    if (!serviceCategory) {
      return res.status(404).json({ message: "Service category not found" });
    }

    if (serviceCategory.videoUrl) {
      const publicId = serviceCategory.videoUrl.split("/").pop().split(".")[0];
      await cloudinary.uploader.destroy(publicId, { resource_type: "video" });
    }

    for (let imageUrl of serviceCategory.imageUrl) {
      const publicId = imageUrl.split("/").pop().split(".")[0];
      await cloudinary.uploader.destroy(publicId);
    }

    await serviceCategory.remove();
    res.json({ message: "Service category deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getServiceCategories = async (req, res) => {
  try {
    const serviceCategories = await ServiceCategory.find();
    res.json(serviceCategories);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const createServiceType = async (req, res) => {
  try {
    const { serviceCategory, name, rate, description, imageUrl, videoUrl } = req.body;
    let uploadedVideo = null;
    let uploadedImages = [];

    if (videoUrl) {
      uploadedVideo = await cloudinary.uploader.upload(videoUrl, {
        resource_type: "video",
        folder: "techcare/service_type_videos",
      });
      console.log("Uploaded video:", uploadedVideo.secure_url);
    }


    if (imageUrl) {
      const imagesToUpload = Array.isArray(imageUrl) ? imageUrl : [imageUrl];

      for (let image of imagesToUpload) {
        try {
          const uploadedImage = await cloudinary.uploader.upload(image, {
            folder: "techcare/service_type_images",
          });
          uploadedImages.push(uploadedImage.secure_url);
          console.log("Uploaded image:", uploadedImage.secure_url);
        } catch (uploadError) {
          console.error("Error uploading image:", uploadError);
        }
      }
    } else {
      console.log("No images to process");
    }


    const serviceType = new ServiceType({
      serviceCategory,
      name,
      rate,
      description,
      videoUrl: uploadedVideo ? uploadedVideo.secure_url : null,
      imageUrl: uploadedImages,
    });

    await serviceType.save();
    res.status(201).json(serviceType);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const updateServiceType = async (req, res) => {
  try {
    const { serviceCategory, name, rate, description, imageUrl, deleteImages,videoUrl } =
      req.body;
    const serviceType = await ServiceType.findById(req.params.id);

    if (!serviceType) {
      return res.status(404).json({ message: "Service type not found" });
    }

    if (serviceCategory) serviceType.serviceCategory = serviceCategory;
    if (name) serviceType.name = name;
    if (rate) serviceType.rate = rate;
    if (description) serviceType.description = description;


    if (videoUrl) {
      if (serviceType.videoUrl) {
        const publicId = serviceType.videoUrl
          .split("/")
          .pop()
          .split(".")[0];
        await cloudinary.uploader.destroy(publicId, { resource_type: "video" });
      }
      const uploadedVideo = await cloudinary.uploader.upload(videoUrl, {
        resource_type: "video",
        folder: "techcare/service_type_videos",
      });
      serviceCategory.videoUrl = uploadedVideo.secure_url;
    }
    
    if (deleteImages && deleteImages.length > 0) {
      for (let imageUrl of deleteImages) {
        const publicId = imageUrl.split("/").pop().split(".")[0];
        await cloudinary.uploader.destroy(publicId);
        serviceType.imageUrl = serviceType.imageUrl.filter(
          (url) => url !== imageUrl
        );
      }
    }

    if (imageUrl && imageUrl.length > 0) {
      const newImages = [];
      for (let image of imageUrl) {
        if (!image.startsWith("http")) {
          const uploadedImage = await cloudinary.uploader.upload(image, {
            folder: "techcare/service_type_images",
          });
          newImages.push(uploadedImage.secure_url);
        } else {
          newImages.push(image);
        }
      }

      serviceType.imageUrl = newImages;
    }

    serviceType.updatedAt = Date.now();
    await serviceType.save();
    res.json(serviceType);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const deleteServiceType = async (req, res) => {
  try {
    const serviceType = await ServiceType.findById(req.params.id);

    if (!serviceType) {
      return res.status(404).json({ message: "Service type not found" });
    }

    for (let imageUrl of serviceType.imageUrl) {
      const publicId = imageUrl.split("/").pop().split(".")[0];
      await cloudinary.uploader.destroy(publicId);
    }

    await serviceType.remove();
    res.json({ message: "Service type deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getServiceTypes = async (req, res) => {
  try {
    const serviceTypes = await ServiceType.find().populate("serviceCategory");
    res.json(serviceTypes);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  listUsers,
  toggleBlockUser,
  toggleAuthorizeTechnician,
  createServiceCategory,
  updateServiceCategory,
  deleteServiceCategory,
  getServiceCategories,
  createServiceType,
  updateServiceType,
  deleteServiceType,
  getServiceTypes,
};

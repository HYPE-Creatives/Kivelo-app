import Family from '../models/Family.js';
import User from '../models/User.js';
import CloudinaryService from '../services/cloudinaryService.js';

export const createFamily = async (req, res) => {
  try {
    const { name, description } = req.body;
    const createdBy = req.user.id;

    const familyData = {
      name,
      description,
      createdBy,
      members: [createdBy],
    };

    // Upload family photo if provided
    if (req.file) {
      const result = await CloudinaryService.uploadImage(req.file.path, 'kivelo-images/families');
      familyData.familyPhoto = {
        url: result.secure_url,
        public_id: result.public_id,
      };
    }

    const family = new Family(familyData);
    await family.save();

    // Update user's family reference
    await User.findByIdAndUpdate(createdBy, { family: family._id });

    res.status(201).json(family);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

export const updateFamily = async (req, res) => {
  try {
    const { name, description } = req.body;
    const updateData = { name, description };

    const family = await Family.findById(req.params.id);
    
    if (!family) {
      return res.status(404).json({ message: 'Family not found' });
    }

    // Check if user is family admin
    if (family.createdBy.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized to update this family' });
    }

    // If there's a new family photo
    if (req.file) {
      const result = await CloudinaryService.uploadImage(req.file.path, 'kivelo-images/families');
      
      updateData.familyPhoto = {
        url: result.secure_url,
        public_id: result.public_id,
      };

      // Delete old family photo if exists
      if (family.familyPhoto?.public_id) {
        await CloudinaryService.deleteImage(family.familyPhoto.public_id);
      }
    }

    const updatedFamily = await Family.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    ).populate('members', 'name email avatar role');

    res.json(updatedFamily);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

export const deleteFamilyPhoto = async (req, res) => {
  try {
    const family = await Family.findById(req.params.id);
    
    if (!family) {
      return res.status(404).json({ message: 'Family not found' });
    }

    if (family.createdBy.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    if (family.familyPhoto?.public_id) {
      await CloudinaryService.deleteImage(family.familyPhoto.public_id);
      
      family.familyPhoto = undefined;
      await family.save();
    }

    const updatedFamily = await Family.findById(req.params.id)
      .populate('members', 'name email avatar role');
    
    res.json(updatedFamily);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};
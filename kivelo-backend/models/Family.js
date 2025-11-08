import mongoose from 'mongoose';

const familySchema = new mongoose.Schema({
  name: { 
    type: String, 
    required: true 
},
  description: String,
  familyPhoto: {
    url: String,
    public_id: String,
  },
  createdBy: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
},
  members: [{ 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User' 
}],
}, { timestamps: true });

export default mongoose.model('Family', familySchema);
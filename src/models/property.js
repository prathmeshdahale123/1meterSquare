const mongoose = require("mongoose");

const propertySchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    maxLength: 100
  },
  description: {
    type: String,
    maxLength: 1000 
  },
  price: {
    type: Number,
  },
  location: {
    city: { type: String },
    state: { type: String },
    address: { type: String },
    coordinates: {
      lat: { type: Number },
      lng: { type: Number },
    },
  },
  images: [{ type: String }], // array of image URLs
  listedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, // ref to user model
  status: {
    type: String,
    enum: ['available', 'sold'],
    default: 'available',
  },
},{
    timestamps: true
});


const Property = mongoose.model("Property", propertySchema);

module.exports = {
    Property
};

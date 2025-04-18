const mongoose = require("mongoose");

const favoritePropertySchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  propertyId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Property",
    required: true,
  }
}, {
  timestamps: true 
});

const Favorite = mongoose.model("favoriteProperty", favoritePropertySchema);

module.exports = {
    Favorite
};

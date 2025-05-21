const express = require("express");
const favoriteRouter = express.Router();
const { Favorite } = require("../models/favorite");
const { Property } = require("../models/property");
const { auth } = require("../middleware/auth");

// Add to favorites
favoriteRouter.post("/api/favorites/:propertyId", auth, async (req, res) => {
  try {
    const { propertyId } = req.params;

    const property = await Property.findById(propertyId);
    if (!property) throw new Error("Property not found");

    const existing = await Favorite.findOne({ userId: req.user._id, propertyId: propertyId });
    if (existing) throw new Error("Property already in favorites");

    const favorite = new Favorite({ userId: req.user._id, propertyId: propertyId });
    await favorite.save();

    res.status(201).json({ message: "Added to favorites" });
  } catch (err) {
    res.status(400).json({ ERROR: err.message });
  }
});

// Get all favorites for logged-in user
favoriteRouter.get("/api/favorites", auth, async (req, res) => {
  try {
    const favorites = await Favorite.find({ userId: req.user._id }).populate("propertyId");
    res.status(200).json({ favorites });
  } catch (err) {
    res.status(500).json({ ERROR: err.message });
  }
});

// Remove from favorites
favoriteRouter.delete("/api/favorites/:propertyId", auth, async (req, res) => {
  try {
    const { propertyId } = req.params;

    const deleted = await Favorite.findOneAndDelete({ userId: req.user._id, propertyId: propertyId });
    if (!deleted) return res.status(404).json({ ERROR: "Favorite not found" });

    res.status(200).json({ message: "Removed from favorites" });
  } catch (err) {
    res.status(400).json({ ERROR: err.message });
  }
});

module.exports = { favoriteRouter };

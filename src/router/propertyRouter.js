const express = require("express");
const propertyRouter = express.Router();
const { Property } = require("../models/property");
const { auth } = require("../middleware/auth");
const { roleCheck } = require("../middleware/rolemiddleware");
const { upload } = require("../middleware/upload");


// Create a new property with image upload
propertyRouter.post(
  "/api/properties",
  auth,
  roleCheck(["seller", "admin"]),
  upload.array("images", 5), 
  async (req, res) => {
    try {
      const { title, description, price, location } = req.body;

      // Parse location from string (form-data) to object
      const parsedLocation = typeof location === "string"
        ? JSON.parse(location)
        : location;

      if (!title || !price || !parsedLocation || !parsedLocation.city) {
        throw new Error("Required fields missing");
      }

      const imageUrls = req.files.map((file) => file.path);

      const newProperty = new Property({
        title,
        description,
        price,
        location: parsedLocation,
        images: imageUrls,
        listedBy: req.user._id,
      });

      await newProperty.save();
      res.status(201).send("Property created succesfully");
    } catch (err) {
      res.status(400).send("ERROR: " + err.message);
    }
  }
);


  
//   Get all properties (feed API)
propertyRouter.get("/feed", async (req, res) => {
  try {
    const {
      search,
      minPrice,
      maxPrice,
      page = 1,
      limit = 10,
      north,
      south,
      east,
      west,
    } = req.query;

    const filter = {};

    if (search) {
      const regex = new RegExp(search, "i");
      filter.$or = [
        { title: regex },
        { "location.city": regex },
        { "location.state": regex },
      ];
    }

    if (minPrice || maxPrice) {
      filter.price = {};
      if (minPrice) filter.price.$gte = Number(minPrice);
      if (maxPrice) filter.price.$lte = Number(maxPrice);
    }

    if (north && south && east && west) {
      filter["location.coordinates.lat"] = { $lte: Number(north), $gte: Number(south) };
      filter["location.coordinates.lng"] = { $lte: Number(east), $gte: Number(west) };
    }

    const skip = (Number(page) - 1) * Number(limit);

    const properties = await Property.find(filter)
      .populate("listedBy", "firstName lastName contactNumber")
      .skip(skip)
      .limit(Number(limit));

    const total = await Property.countDocuments(filter);

    res.json({properties});
  } catch (err) {
    res.status(500).send("ERROR: " + err.message);
  }
});



// Get details of a specific property by ID.
  propertyRouter.get("/api/properties/:id", async (req, res) => {
    try {
      const property = await Property.findById(req.params.id)
      .populate("listedBy", "firstName lastName contactNumber");
      
      if (!property) throw new Error("Property not found");
      res.send(property);
    } catch (err) {
      res.status(404).send("ERROR: " + err.message);
    }
  });
  
// Update a property (only the seller who created it or admin).
  propertyRouter.put("/api/properties/:id", auth, async (req, res) => {
    try {
      const property = await Property.findById(req.params.id);
      if (!property) throw new Error("Property not found");
  
      if (property.listedBy.toString() !== req.user._id && req.user.role !== "admin") {
        return res.status(403).send("Access denied");
      }
  
      Object.assign(property, req.body);
      await property.save();
  
      res.send("Property updated successfully");
    } catch (err) {
      res.status(400).send("ERROR: " + err.message);
    }
  });

//   Delete a property (only owner or admin).
  propertyRouter.delete("/api/properties/:id", auth, async (req, res) => {
    try {
      const property = await Property.findById(req.params.id);
      if (!property) throw new Error("Property not found");
  
      if (property.listedBy.toString() !== req.user._id && req.user.role !== "admin") {
        return res.status(403).send("Access denied");
      }
  
      await property.deleteOne();
      res.send("Property deleted successfully");
    } catch (err) {
      res.status(400).send("ERROR: " + err.message);
    }
  });
  

  module.exports = {
    propertyRouter
  }
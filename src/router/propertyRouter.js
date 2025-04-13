const express = require("express");
const propertyRouter = express.Router();
const { Property } = require("../models/property");
const { auth } = require("../middleware/auth");
const { roleCheck } = require("../middleware/rolemiddleware");


// create new property listing
propertyRouter.post("/api/properties", auth, roleCheck(["seller", "admin"]), async (req, res) => {
    try {
      const { title, description, price, location, images } = req.body;

      if (!title || !price || !location || !location.city) {
        throw new Error("Required fields missing");
      }

      const newProperty = new Property({
        title,
        description,
        price,
        location,
        images,
        listedBy: req.user._id,
      });
  
      await newProperty.save();
      res.status(201).send("Property created successfully");
    } catch (error) {
      res.status(400).send("ERROR: " + error.message);
    }
  });
  
//   Get all properties
  propertyRouter.get("/api/properties", async (req, res) => {
    try {
      const properties = await Property.find().populate("listedBy", "firstName lastName role");
      res.send(properties);
    } catch (err) {
      res.status(500).send("Failed to fetch properties");
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
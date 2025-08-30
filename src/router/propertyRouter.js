const express = require("express");
const propertyRouter = express.Router();
const { Property } = require("../models/property");
const { User } = require("../models/user"); 
const { auth } = require("../middleware/auth");
const { upload } = require("../middleware/upload");

// --- CREATE A NEW PROPERTY ---
propertyRouter.post(
    "/api/properties",
    auth,
    upload.array("images", 10),
    async (req, res) => {
        try {
            const { title, description, propertyType, price, location, details, amenities } = req.body;

            if (!title || !propertyType || !price || !location || !details || !req.files || req.files.length === 0) {
                return res.status(400).json({ success: false, message: "Missing required fields." });
            }

            const parsedPrice = JSON.parse(price);
            const parsedLocation = JSON.parse(location);
            const parsedDetails = JSON.parse(details);

            const newPropertyData = {
                title, description, propertyType,
                price: {
                    value: Number(parsedPrice.value),
                    isNegotiable: parsedPrice.isNegotiable || false,
                },
                location: {
                    address: parsedLocation.address, city: parsedLocation.city, state: parsedLocation.state, pincode: parsedLocation.pincode,
                    coordinates: { coordinates: [parsedLocation.coordinates.lng, parsedLocation.coordinates.lat] },
                },
                details: {
                    area: { value: Number(parsedDetails.area.value) },
                    bedrooms: Number(parsedDetails.bedrooms), bathrooms: Number(parsedDetails.bathrooms),
                    furnishingStatus: parsedDetails.furnishingStatus, possessionDate: parsedDetails.possessionDate, floor: Number(parsedDetails.floor),
                },
                amenities: amenities ? JSON.parse(amenities) : [],
                images: req.files.map((file) => file.path),
                thumbnail: req.files[0].path,
                listedBy: req.user._id,
            };

            const property = new Property(newPropertyData);
            await property.save();
            
            res.status(201).json({ success: true, message: "Property listed successfully.", data: property });

        } catch (error) {
            res.status(400).json({ success: false, message: "Failed to create property.", error: error.message });
        }
    }
);

// --- GET ALL PROPERTIES (FEED API - Updated with Case-Insensitive Filter) ---
propertyRouter.get("/api/properties/feed", async (req, res) => {
    try {
        const { search, city, propertyType, minPrice, maxPrice, bedrooms, status, page = 1, limit = 10, sortBy = 'createdAt', order = 'desc', lat, lng, radius } = req.query;
        let filter = {};

        if (status) {
            filter.status = status;
        } else {
            filter.status = 'Available'; // Default to available properties
        }

        if (search) filter.$or = [{ title: new RegExp(search, "i") }, { description: new RegExp(search, "i") }];
        if (city) filter['location.city'] = new RegExp(`^${city}$`, 'i');
        
        // --- CHANGE IS HERE ---
        // The propertyType filter is now case-insensitive, just like the city filter.
        if (propertyType) {
            filter.propertyType = new RegExp(`^${propertyType}$`, 'i');
        }
        // --------------------

        if (bedrooms) filter['details.bedrooms'] = { $gte: Number(bedrooms) };
        if (minPrice || maxPrice) {
            filter['price.value'] = {};
            if (minPrice) filter['price.value'].$gte = Number(minPrice);
            if (maxPrice) filter['price.value'].$lte = Number(maxPrice);
        }
        if (lat && lng && radius) {
            filter['location.coordinates'] = {
                $geoWithin: { $centerSphere: [[parseFloat(lng), parseFloat(lat)], parseFloat(radius) / 6378.1] }
            };
        }

        const skip = (Number(page) - 1) * Number(limit);
        const sortOptions = { [sortBy]: order === 'asc' ? 1 : -1 };

        const properties = await Property.find(filter).populate("listedBy", "firstName lastName").sort(sortOptions).skip(skip).limit(Number(limit));
        const total = await Property.countDocuments(filter);

        res.status(200).json({ 
            success: true, 
            data: { properties, totalPages: Math.ceil(total / limit), currentPage: Number(page), totalProperties: total } 
        });
    } catch (error) {
        res.status(500).json({ success: false, message: "An error occurred.", error: error.message });
    }
});


// GET SELLER'S OWN LISTINGS
propertyRouter.get("/api/properties/my-listings", auth, async (req, res) => {
    try {
        const properties = await Property.find({ listedBy: req.user._id }).sort({ createdAt: -1 });
        res.status(200).json({ success: true, count: properties.length, data: properties });
    } catch (error) {
        res.status(500).json({ success: false, message: "Could not fetch your listings.", error: error.message });
    }
});

// GET A SINGLE PROPERTY BY ID
propertyRouter.get("/api/properties/:id", async (req, res) => {
    try {
        const property = await Property.findByIdAndUpdate(
            req.params.id, 
            { $inc: { viewCount: 1 } },
            { new: true }
        ).populate("listedBy", "firstName lastName contactNumber");

        if (!property) {
            return res.status(404).json({ success: false, message: "Property not found." });
        }
        res.status(200).json({ success: true, data: property });
    } catch (error) {
        res.status(404).json({ success: false, message: "Property not found or invalid ID.", error: error.message });
    }
});

// UPDATE A PROPERTY
propertyRouter.put("/api/properties/:id", auth, async (req, res) => {
    try {
        const property = await Property.findById(req.params.id);
        if (!property) {
            return res.status(404).json({ success: false, message: "Property not found." });
        }
        if (property.listedBy.toString() !== req.user._id.toString() && req.user.role !== "admin") {
            return res.status(403).json({ success: false, message: "Access denied." });
        }

        const allowedUpdates = ['title', 'description', 'price', 'details', 'amenities', 'status'];
        const updates = {};
        for (const key in req.body) {
            if (allowedUpdates.includes(key)) {
                updates[key] = req.body[key];
            }
        }
        
        const updatedProperty = await Property.findByIdAndUpdate(req.params.id, { $set: updates }, { new: true, runValidators: true });
        res.status(200).json({ success: true, message: "Property updated successfully.", data: updatedProperty });
    } catch (error) {
        res.status(400).json({ success: false, message: "Failed to update property.", error: error.message });
    }
});

// DELETE A PROPERTY
propertyRouter.delete("/api/properties/:id", auth, async (req, res) => {
    try {
        const property = await Property.findById(req.params.id);
        if (!property) {
            return res.status(404).json({ success: false, message: "Property not found." });
        }
        if (property.listedBy.toString() !== req.user._id.toString() && req.user.role !== "admin") {
            return res.status(403).json({ success: false, message: "Access denied." });
        }

        await Property.findByIdAndDelete(req.params.id);
        res.status(200).json({ success: true, message: "Property deleted successfully." });
    } catch (error) {
        res.status(500).json({ success: false, message: "Failed to delete property.", error: error.message });
    }
});


module.exports = {
    propertyRouter,
};


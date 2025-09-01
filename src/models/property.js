const mongoose = require("mongoose");

const propertySchema = new mongoose.Schema({
    // --- Basic Information ---
    title: {
        type: String,
        required: [true, "Property title is required."],
        maxLength: 100,
        trim: true,
    },
    description: {
        type: String,
        required: [true, "Property description is required."],
        maxLength: 2000,
        trim: true,
    },
    propertyType: {
        type: String,
        required: [true, "Property type is required."],
        enum: ['Apartment', 'Villa', 'House', 'Land', 'Office', 'Shop'],
    },
    isResaleProperty: {
        type: Boolean,
        required: [true, "Please specify if this is a resale property."]
    },
    reraId: {
        type: String,
        trim: true,
        uppercase: true, // RERA IDs are typically uppercase
    },
    // --- Location Details ---
    location: {
        address: { type: String, required: true, trim: true },
        city: { type: String, required: true, trim: true },
        state: { type: String, required: true, trim: true },
        pincode: { type: String, required: true, trim: true },
        // GeoJSON for geospatial queries (e.g., "properties near me")
        coordinates: {
            type: { type: String, enum: ['Point'], default: 'Point' },
            coordinates: { type: [Number], required: true }, // [longitude, latitude]
        },
    },

    // --- Pricing Details ---
    price: {
        value: { type: Number, required: true },
        currency: { type: String, default: 'INR' },
        isNegotiable: { type: Boolean, default: false },
    },
    // --- REMOVED: rentalDetails object ---

    // --- Property Specifics ---
    details: {
        area: { value: Number, unit: { type: String, enum: ['sqft', 'sqm'], default: 'sqft' } },
        bedrooms: { type: Number, required: true, min: 0 },
        bathrooms: { type: Number, required: true, min: 0 },
        furnishingStatus: { type: String, enum: ['Furnished', 'Semi-Furnished', 'Unfurnished'], default: 'Unfurnished' },
        possessionDate: { type: Date },
        floor: { type: Number },
    },

    // --- Media ---
    images: [{ type: String, required: true }],
    thumbnail: { type: String },

    // --- Amenities ---
    amenities: [{ type: String, trim: true }],

    // --- Management & Status ---
    listedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    status: {
        type: String,
        enum: ['Available', 'Sold', 'Under Offer'], // --- REMOVED: 'Rented' ---
        default: 'Available',
    },
    isVerified: { type: Boolean, default: false },

    // --- Engagement Metrics ---
    viewCount: { type: Number, default: 0 },
    favoritesCount: { type: Number, default: 0 },
    
}, {
    timestamps: true
});

// --- OPTIMIZATION: DATABASE INDEXES ---
propertySchema.index({ 'location.coordinates': '2dsphere' });
propertySchema.index({ 
    'location.city': 1, 
    propertyType: 1, 
    'price.value': 1,
    'details.bedrooms': 1
});
propertySchema.index({ listedBy: 1 });

const Property = mongoose.model("Property", propertySchema);

module.exports = { Property };
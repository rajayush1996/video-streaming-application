const mongoose = require('mongoose');

const {Schema} = mongoose;
const utils = require('../utils/utils');
const {toJSON, paginate} = require('./plugins');

const userSchema = new Schema({
    _id: {
        type: String,
    },
    firstName: {
        type: String,
        trim: true,
        maxlength: 200,
    },
    lastName: {
        type: String,
        trim: true,
        maxlength: 200,
    },
    lname: {
        type: String,
        lowercase: true,
    },
    phoneNumber: {
        countryCode: {
            type: String,
            required: true,
        },
        number: {
            type: String,
            required: true,
            trim: true,
            unique: true,
        },
    },
    hashedOtp: {
        type: String,
    },
    isActive: {
        type: Boolean,
        default: true,
    },
    isOtpVerified: {
        type: Boolean,
        default: false,
    },
    description: {
        type: String,
        trim: true,
    },
    role: {
        type: String,
        enum: ['ASTROLOGER', 'CUSTOMER'],
    },
    mobNumber: {
        type: String,
    },
},
{
    timestamps: true,
    versionKey: 'false',
});

// Add plugin that converts mongoose to json
userSchema.plugin(toJSON);
userSchema.plugin(paginate);

userSchema.pre('save', async function (next) {
    const user = this;
    if (!user._id) {
        user._id = await utils.uuid('u-');
    }

    return next();
});

/**
 * @typedef User
 */
const User = mongoose.model('User', userSchema);

module.exports = User;


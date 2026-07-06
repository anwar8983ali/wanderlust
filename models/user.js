const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const passportLocalMongoose = require("passport-local-mongoose");

const userSchema = new Schema({

    email: {
        type: String,
        required: true
    },

    favorites: [{
        type: Schema.Types.ObjectId,
        ref: "listing"
    }],

    resetOTP: {
        type: String,
        default: null
    },

    otpExpiry: {
        type: Date,
        default: null
    }

});

userSchema.plugin(passportLocalMongoose);

module.exports = mongoose.model("User", userSchema);
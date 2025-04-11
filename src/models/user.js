const mongoose = require("mongoose");


const userSchema = new mongoose.Schema({
    firstName: {
        type: String,
        required: true,
        minLength: 4,
        maxLength: 20
    },
    lastname: {
        type: String,
        required: true,
        minLength: 4,
        maxLength: 20
    },
    email: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        lowercase: true,
        maxLength: 50,
        validate(value) {
            if(!validator.isEmail(value)){
                throw new Error("Invalide emailId")
            }
        }
    },
    passwordHash: {
        type: String,
        required: true,
        validate(value){
            if(!validator.isStrongPassword(value)){
                throw new Error("enter strong password")
            }
        }
    },
    role: "buyer" | "seller" | "admin",
    contactNumber: {
        type: Number,
        minLength: 10,
        maxLength: 10
    },
}, {
    timestamps: true
})
  

userSchema.methods.setJWT = async function () {
    const user = this;
    
    const token = await jwt.sign({_id: user._id}, process.env.SECRET, {
            expiresIn: "7d"
        })
        return token;

}

userSchema.methods.validatePassword = async function (passwordInputByUser) {
    const user = this;
    const passwordHash = user.password;
    const isPassValid = await bcrypt.compare(
        passwordInputByUser,
        passwordHash
    )
        return isPassValid;
}

const User = mongoose.model("User", userSchema)

module.exports = {
    User
}

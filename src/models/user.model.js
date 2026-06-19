import mongoose, { Schema } from "mongoose";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";

// this is the method of creating a model that we are making.

const userSchema = new Schema(
  {
    username: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },

    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },

    fullname: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },

    avatar: {
      type: String,
      required: true,
    },

    coverImage: {
      type: String,
    },

    watchHistory: [
      {
        type: Schema.Types.ObjectId,
        ref: "Video",
      },
    ],

    password: {
      type: String,
      required: [true, "Password is required"],
    },

    refreshToken: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

// this is for authentication in mongoose.

// mongoose hook / middleware
// before saving user, run this function first

userSchema.pre("save", async function () {

  // if password is not modified
  // skip hashing

  if (!this.isModified("password"))
    return;

  // hash password before saving

  this.password = await bcrypt.hash(
    this.password,
    10
  );
});

// This creates a method on every user object.

userSchema.methods.isPasswordCorrect = async function (password) {

  // compare entered password with hashed password

  return await bcrypt.compare(
    password,
    this.password
  );
};

// this method is for generating Access Token

userSchema.methods.generateAccessToken = function () {

  // Every user object can now generate its own JWT token.

  return jwt.sign(
    {
      _id: this._id,
      email: this.email,
      username: this.username,
      fullname: this.fullname,
    },

    // this is for the access token secret

    process.env.ACCESS_TOKEN_SECRET,

    {
      expiresIn: process.env.ACCESS_TOKEN_EXPIRY,
    }
  );
};

// this method is for generating Refresh Token

userSchema.methods.generateRefreshToken = function () {

  // refresh token usually stores minimal data

  return jwt.sign(
    {
      _id: this._id,
    },

    // this is for the refresh token secret

    process.env.REFRESH_TOKEN_SECRET,

    {
      expiresIn: process.env.REFRESH_TOKEN_EXPIRY,
    }
  );
};

export default mongoose.model(
  "User",
  userSchema
);
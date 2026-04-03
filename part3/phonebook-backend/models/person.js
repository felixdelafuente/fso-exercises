// models/person.js
// Mongoose model for a phonebook Person with validation rules.

const mongoose = require("mongoose");

const numberValidator = [
  {
    validator: (v) => {
      // Must be at least 8 characters
      return v && v.length >= 8;
    },
    message: "Phone number must be at least 8 characters long",
  },
  {
    validator: (v) => {
      // Must match pattern: two or three digits, dash, then digits
      // Examples valid: 09-1234556, 040-22334455
      // Invalid: 1234556, 1-22334455, 10-22-334455
      return /^\d{2,3}-\d+$/.test(v);
    },
    message: "Phone number must be of form XX-XXXXXXX or XXX-XXXXXXX",
  },
];

const personSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, "Person name required"],
    minlength: [3, "Name must be at least 3 characters long"],
    unique: true,
  },
  number: {
    type: String,
    required: [true, "Phone number required"],
    validate: numberValidator,
  },
});

// Transform returned document: remove __v and rename _id to id
personSchema.set("toJSON", {
  transform: (document, returnedObject) => {
    returnedObject.id = returnedObject._id.toString();
    delete returnedObject._id;
    delete returnedObject.__v;
  },
});

module.exports = mongoose.model("Person", personSchema);

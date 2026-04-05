/**
 * =============================================================================
 * USER MODEL - Mongoose Schema Definition for Users
 * =============================================================================
 * 
 * This file defines the data structure for User accounts in our application.
 * 
 * WHAT IS A MODEL?
 * A model is a blueprint for creating objects that can be stored in a database.
 * In Mongoose, we define schemas that specify what fields each document should have,
 * what types those fields are, and any validation rules.
 * 
 * =============================================================================
 */

const mongoose = require("mongoose");

/**
 * User Schema Definition
 * 
 * Each user will have:
 * - username: Unique identifier for login (required, min 3 chars)
 * - name: Display name (optional)
 * - passwordHash: Encrypted password (never store plain text!)
 * - blogs: Array of references to Blog posts this user created
 * 
 * WHY STORE BLOGS IN USER?
 * This creates a bidirectional relationship:
 * - Each blog knows its author (blog.user)
 * - Each user knows their blogs (user.blogs)
 * 
 * This makes it easy to:
 * - Find all blogs by a specific user
 * - See who created a specific blog
 * - Display user's blog list on their profile
 * 
 */
const userSchema = new mongoose.Schema({
  username: { 
    type: String, 
    required: true,      // Username must be provided
    unique: true,       // No two users can have the same username
    minlength: 3,       // Minimum 3 characters
  },
  name: String,         // Optional - user can choose not to provide a name
  passwordHash: String, // Store the encrypted password, never plain text
  /**
   * blogs: Array of ObjectIds referencing the Blog model
   * 
   * This is a "one-to-many" relationship:
   * - One user can have many blogs
   * - Each blog has one user (author)
   * 
   * { type: mongoose.Schema.Types.ObjectId } tells MongoDB this is a reference
   * ref: 'Blog' tells Mongoose which model this references
   * 
   * NOTE: This is optional - we don't require users to have any blogs
   */
  blogs: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Blog",  // Reference to the Blog model
    },
  ],
});

/**
 * toJSON Transformation
 * 
 * When we convert a Mongoose document to JSON (e.g., when sending as API response),
 * we want to customize the output format for security and consistency.
 * 
 * This transform:
 * - Converts MongoDB's _id to a string and renames it to 'id'
 * - Removes __v (Mongoose version number - internal use only)
 * - Removes passwordHash (NEVER expose passwords in API responses!)
 * 
 * SECURITY NOTE:
 * We explicitly delete passwordHash because:
 * 1. It's a sensitive field that should never be sent to clients
 * 2. Even though it's hashed, there's no reason to expose it
 * 
 */
userSchema.set("toJSON", {
  transform: (document, returnedObject) => {
    returnedObject.id = returnedObject._id.toString();
    delete returnedObject._id;
    delete returnedObject.__v;
    delete returnedObject.passwordHash;
  },
});

/**
 * Export the User model
 * 
 * mongoose.model() creates a model from our schema.
 * We can now use 'User' in other files to:
 * - Create new users: new User({ username: 'john', ... })
 * - Query users: User.find({})
 * - Find user by username: User.findOne({ username: 'john' })
 * - Update user: User.findByIdAndUpdate(id, updates)
 * - Access user's blogs: User.findById(id).populate('blogs')
 */
module.exports = mongoose.model("User", userSchema);

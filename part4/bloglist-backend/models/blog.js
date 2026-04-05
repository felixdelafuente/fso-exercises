/**
 * =============================================================================
 * BLOG MODEL - Mongoose Schema Definition
 * =============================================================================
 * 
 * This file defines the data structure for Blog posts in our application.
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
 * Blog Schema Definition
 * 
 * Each blog post will have:
 * - title: The headline of the blog (required, String)
 * - author: Who wrote the blog (String)
 * - url: Link to the original content (required, String)
 * - likes: Number of likes/upvotes (default: 0)
 * - user: Reference to the User who created this blog (ObjectId)
 * 
 * ObjectId is a special type in MongoDB used to reference other documents.
 * This creates a relationship between Blog and User documents.
 */
const blogSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,  // Validation: title must be provided
  },
  author: {
    type: String,
    // Optional - blog can exist without an author
  },
  url: {
    type: String,
    required: true,  // Validation: url must be provided
  },
  likes: {
    type: Number,
    default: 0,      // If not specified, defaults to 0 likes
  },
  /**
   * user: Reference to the User model
   * 
   * This creates a "foreign key" relationship. Each blog knows which
   * user created it. We use { type: mongoose.Schema.Types.ObjectId } to
   * tell MongoDB this field stores an ID that references the 'User' model.
   * 
   * ref: 'User' tells Mongoose which model this ObjectId points to.
   */
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",     // Reference to the User model
  },
});

/**
 * toJSON Transformation
 * 
 * When we convert a Mongoose document to JSON (e.g., when sending as API response),
 * we want to customize the output format.
 * 
 * This transform:
 * - Converts MongoDB's _id to a string and renames it to 'id' (more standard)
 * - Removes __v (Mongoose version number - not useful for API consumers)
 * 
 * WHY DO THIS?
 * - _id is MongoDB specific; id is more universal
 * - __v is an internal Mongoose field that clients don't need to see
 */
blogSchema.set("toJSON", {
  transform: (document, returnedObject) => {
    returnedObject.id = returnedObject._id.toString();
    delete returnedObject._id;
    delete returnedObject.__v;
  },
});

/**
 * Export the Blog model
 * 
 * mongoose.model() creates a model from our schema.
 * We can now use 'User' in other files to:
 * - Create new blog documents: new Blog({ title: 'My Post', ... })
 * - Query blogs: Blog.find({})
 * - Update blogs: Blog.findByIdAndUpdate(id, updates)
 * - Delete blogs: Blog.findByIdAndDelete(id)
 */
module.exports = mongoose.model("Blog", blogSchema);
/**
 * =============================================================================
 * BLOGS CONTROLLER - API Route Handlers for Blog Posts
 * =============================================================================
 * 
 * This file defines all the API endpoints (routes) for working with blogs.
 * 
 * WHAT IS A CONTROLLER?
 * In the MVC (Model-View-Controller) pattern, controllers handle the "logic" part.
 * They:
 * 1. Receive incoming HTTP requests (from the client/frontend)
 * 2. Process the request (validate data, call models to interact with DB)
 * 3. Send back an HTTP response (JSON data, status codes)
 * 
 * Each function below corresponds to one API endpoint.
 * 
 * =============================================================================
 */

const blogsRouter = require("express").Router();        // Router object for defining routes
const Blog = require("../models/blog");                  // Import Blog model for database operations
const jwt = require("jsonwebtoken");                    // For verifying JWT tokens (authentication)
const config = require("../utils/config");              // Configuration (like SECRET key)

/**
 * =============================================================================
 * GET /api/blogs - Fetch all blogs
 * =============================================================================
 * 
 * This endpoint retrieves all blog posts from the database.
 * 
 * HOW IT WORKS:
 * 1. Blog.find({}) queries all documents in the 'blogs' collection
 *    - The empty {} means "no filter" - return everything
 *    - .populate('user') replaces the user ObjectId with actual user data
 * 
 * 2. We use .populate() to "expand" the reference:
 *    - In our Blog model, 'user' is just an ID (ObjectId)
 *    - .populate('user') tells MongoDB to fetch the actual User document
 *    - This lets us see who created each blog!
 * 
 * 3. The results are sent back as JSON with status 200 (OK)
 * 
 * Example response:
 * [
 *   { "id": "abc123", "title": "My First Post", "author": "John", "likes": 5, "user": { "id": "xyz", "username": "john" } },
 *   { "id": "def456", "title": "Another Post", "author": "Jane", "likes": 10, "user": { "id": "yyy", "username": "jane" } }
 * ]
 */
blogsRouter.get("/", async (request, response) => {
  try {
    // Find all blogs and populate the user field with actual user data
    const blogs = await Blog.find({}).populate("user", {
      username: 1,    // Include only username field from User
      name: 1,        // Include only name field from User
    });
    
    // Send successful response with blogs data
    response.json(blogs);
  } catch (error) {
    // If something goes wrong, pass to error handler middleware
    response.status(500).json({ error: "Failed to fetch blogs" });
  }
});

/**
 * =============================================================================
 * POST /api/blogs - Create a new blog post
 * =============================================================================
 * 
 * This endpoint creates a new blog post in the database.
 * Requires authentication (valid JWT token).
 * 
 * HOW IT WORKS:
 * 1. First, we verify the user's token using extractToken middleware
 *    - If no valid token, we return 401 (Unauthorized)
 * 
 * 2. We extract data from request body: title, url, author, likes
 *    - title and url are required (handled by Mongoose validation)
 * 
 * 3. We associate the blog with the logged-in user:
 *    - request.user is set by the token middleware
 *    - This links the blog to the user who created it
 * 
 * 4. We save the blog to the database
 * 
 * 5. Return the created blog with status 201 (Created)
 */
blogsRouter.post("/", async (request, response) => {
  try {
    // Verify token exists - users must be logged in to create blogs
    const token = request.token;
    if (!token) {
      return response.status(401).json({ error: "Token missing" });
    }

    // Get the user ID from the verified token (set by middleware)
    const decodedToken = jwt.verify(token, config.SECRET);
    
    // If token is invalid/expired, jwt.verify throws an error
    // We catch it in the catch block below
    
    // Extract blog data from request body
    const { title, author, url, likes } = request.body;

    // Create a new Blog document
    // We attach the user who created this blog using the decoded token's id
    const blog = new Blog({
      title,
      author,
      url,
      likes: likes || 0,  // Default to 0 if likes not provided
      user: decodedToken.id,  // Link to the User who created this blog
    });

    // Save to database
    const savedBlog = await blog.save();

    // Update the user's blog list (add this blog to their blogs array)
    // We need to import User model for this - let's do it inside the route
    const User = require("../models/user");
    const user = await User.findById(decodedToken.id);
    user.blogs = user.blogs.concat(savedBlog._id);
    await user.save();

    // Return the created blog
    response.status(201).json(savedBlog);
  } catch (error) {
    // Handle different types of errors
    if (error.name === "JsonWebTokenError") {
      return response.status(401).json({ error: "Invalid token" });
    }
    if (error.name === "ValidationError") {
      return response.status(400).json({ error: error.message });
    }
    // Pass other errors to Express error handler
    response.status(500).json({ error: "Failed to create blog" });
  }
});

/**
 * =============================================================================
 * DELETE /api/blogs/:id - Delete a blog post
 * =============================================================================
 * 
 * This endpoint deletes a specific blog post.
 * Only the user who created the blog can delete it.
 * 
 * HOW IT WORKS:
 * 1. Get the blog ID from the URL parameter (request.params.id)
 * 2. Verify the user's token
 * 3. Find the blog in the database
 * 4. Check if the logged-in user is the creator (authorization check)
 * 5. Delete the blog and remove it from the user's blog list
 * 
 * URL Parameter:
 * - :id is a dynamic parameter
 * - Example: DELETE /api/blogs/abc123 deletes blog with id "abc123"
 */
blogsRouter.delete("/:id", async (request, response) => {
  try {
    // Verify token exists
    const token = request.token;
    if (!token) {
      return response.status(401).json({ error: "Token missing" });
    }

    // Verify token and get user info
    const decodedToken = jwt.verify(token, config.SECRET);

    // Find the blog to be deleted
    const blog = await Blog.findById(request.params.id);
    
    // If blog doesn't exist, return 404
    if (!blog) {
      return response.status(404).json({ error: "Blog not found" });
    }

    // Authorization check: only the blog creator can delete it
    // Compare blog.user (ObjectId) with decodedToken.id
    if (blog.user.toString() !== decodedToken.id) {
      return response.status(403).json({ error: "Not authorized to delete this blog" });
    }

    // Delete the blog from the database
    await Blog.findByIdAndDelete(request.params.id);

    // Also remove this blog from the user's blog list
    const User = require("../models/user");
    const user = await User.findById(decodedToken.id);
    user.blogs = user.blogs.filter(b => b.toString() !== request.params.id);
    await user.save();

    // Return success with status 204 (No Content)
    response.status(204).end();
  } catch (error) {
    if (error.name === "JsonWebTokenError") {
      return response.status(401).json({ error: "Invalid token" });
    }
    if (error.name === "CastError") {
      return response.status(400).json({ error: "Invalid blog ID format" });
    }
    response.status(500).json({ error: "Failed to delete blog" });
  }
});

/**
 * =============================================================================
 * PUT /api/blogs/:id - Update a blog post
 * =============================================================================
 * 
 * This endpoint updates an existing blog post.
 * 
 * HOW IT WORKS:
 * 1. Get the blog ID from URL parameter
 * 2. Extract updated data from request body
 * 3. Use findByIdAndUpdate to update the blog
 *    - { new: true } means return the updated document (not the old one)
 *    - { runValidators: true } means run Mongoose validators on update
 * 
 * Note: Anyone can update any blog in this implementation.
 * In a real app, you might want to restrict this to the creator.
 */
blogsRouter.put("/:id", async (request, response) => {
  try {
    const { title, author, url, likes } = request.body;

    // Build the update object (only include fields that were provided)
    const updateObject = {};
    if (title) updateObject.title = title;
    if (author) updateObject.author = author;
    if (url) updateObject.url = url;
    if (likes !== undefined) updateObject.likes = likes;

    // Find and update the blog
    const updatedBlog = await Blog.findByIdAndUpdate(
      request.params.id,
      updateObject,
      { new: true, runValidators: true }
    );

    if (!updatedBlog) {
      return response.status(404).json({ error: "Blog not found" });
    }

    response.json(updatedBlog);
  } catch (error) {
    if (error.name === "ValidationError") {
      return response.status(400).json({ error: error.message });
    }
    if (error.name === "CastError") {
      return response.status(400).json({ error: "Invalid blog ID format" });
    }
    response.status(500).json({ error: "Failed to update blog" });
  }
});

/**
 * Export the router
 * 
 * This router will be mounted in app.js at /api/blogs
 * All routes defined here will be prefixed with /api/blogs
 */
module.exports = blogsRouter;
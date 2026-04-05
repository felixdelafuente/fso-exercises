/**
 * =============================================================================
 * APP.JS - Main Express Application Configuration
 * =============================================================================
 * 
 * This file sets up the Express web application.
 * It configures middleware, connects to the database, and sets up routes.
 * 
 * WHAT IS EXPRESS?
 * Express is a minimal and flexible Node.js web application framework.
 * It provides robust features for web and mobile applications.
 * 
 * KEY CONCEPTS:
 * - Middleware: Functions that process requests before they reach routes
 * - Routing: Mapping HTTP requests to specific handlers
 * - Router: Modular route handlers (like mini-applications)
 * 
 * =============================================================================
 */

// Import required modules
const express = require("express");                    // Express web framework
const mongoose = require("mongoose");                  // MongoDB ODM
const usersRouter = require("./controllers/users");  // Routes for user operations
const blogsRouter = require("./controllers/blogs");  // Routes for blog operations
const middleware = require("./utils/middleware");    // Custom middleware functions
const config = require("./utils/config");             // Configuration settings
const cors = require("cors");                        // Cross-Origin Resource Sharing

// Create the Express application instance
const app = express();

// =============================================================================
// MIDDLEWARE CONFIGURATION
// =============================================================================
// Middleware functions are executed in order when a request comes in.

// CORS (Cross-Origin Resource Sharing)
// Allows requests from different origins (domains)
// In production, you'd want to restrict this to your frontend domain
app.use(cors());

// Body Parser
// express.json() parses incoming requests with JSON payloads
// This is essential for APIs that accept JSON data
// Without this, request.body would be undefined
app.use(express.json());

// Token Extraction Middleware
// Extracts JWT token from Authorization header BEFORE routes are processed
// This makes the token available in request.token for all routes
app.use(middleware.extractToken);

// =============================================================================
// ROUTES
// =============================================================================
// Routes map URL patterns to handler functions.

// Mount users router at /api/users
// All routes in controllers/users.js will be prefixed with /api/users
// Example: POST /api/users, POST /api/users/login
app.use("/api/users", usersRouter);

// Mount blogs router at /api/blogs
// All routes in controllers/blogs.js will be prefixed with /api/blogs
// Example: GET /api/blogs, POST /api/blogs, DELETE /api/blogs/:id
app.use("/api/blogs", blogsRouter);

// =============================================================================
// ERROR HANDLING MIDDLEWARE
// =============================================================================
// These middleware run at the end, after routes have been processed.

// unknownEndpoint
// Catches requests that don't match any route
// Returns 404 "unknown endpoint" error
app.use(middleware.unknownEndpoint);

// errorHandler
// Catches any errors thrown in the application
// Handles different error types and returns appropriate status codes
// This MUST have 4 parameters for Express to recognize it as error middleware
app.use(middleware.errorHandler);

// =============================================================================
// EXPORT THE APP
// =============================================================================
// Export the configured app to be used by index.js
// index.js will import this and start the server
module.exports = app;

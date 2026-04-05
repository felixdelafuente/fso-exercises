/**
 * =============================================================================
 * MIDDLEWARE - Request/Response Processing Functions
 * =============================================================================
 * 
 * Middleware functions are functions that have access to the request object (req),
 * response object (res), and the next middleware function in the request-response
 * cycle.
 * 
 * WHAT IS MIDDLEWARE?
 * Middleware can:
 * - Execute any code
 * - Make changes to the request/response objects
 * - End the request-response cycle
 * - Call the next middleware function
 * 
 * In Express, middleware flows through the chain in the order they're defined.
 * Each middleware can either:
 * - Pass control to the next middleware (call next())
 * - Send a response (end the cycle)
 * - Throw an error (which triggers error handling middleware)
 * 
 * =============================================================================
 */

const jwt = require("jsonwebtoken");
const config = require("./config");

/**
 * =============================================================================
 * unknownEndpoint - Handle requests to non-existent routes
 * =============================================================================
 * 
 * This is a "catch-all" middleware that runs when no other route matched.
 * It returns a 404 status with an error message.
 * 
 * HOW IT WORKS:
 * - This runs at the END of all routes
 * - If we reach here, no route handler matched the URL
 * - We return 404 "unknown endpoint"
 * 
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const unknownEndpoint = (req, res) => {
  res.status(404).send({ error: "unknown endpoint" });
};

/**
 * =============================================================================
 * errorHandler - Global error handling middleware
 * =============================================================================
 * 
 * This middleware catches all errors thrown in the application.
 * It's the central place for error handling.
 * 
 * HOW IT WORKS:
 * - Has 4 parameters: (err, req, res, next)
 * - Express recognizes this as error-handling middleware by the 4 params
 * - We check the error type and return appropriate status codes
 * 
 * Common Mongoose/MongoDB Errors:
 * - ValidationError: When data doesn't meet schema requirements
 * - CastError: When trying to use an invalid ObjectId format
 * - MongoServerError (code 11000): Duplicate key (e.g., duplicate username)
 * 
 * @param {Object} err - The error object that was thrown
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Next middleware function
 */
const errorHandler = (err, req, res, next) => {
  // Handle Mongoose ValidationError (e.g., required field missing)
  if (err.name === "ValidationError") {
    return res.status(400).json({ error: err.message });
  }

  // Handle MongoDB duplicate key error (e.g., duplicate username)
  if (err.name === "MongoServerError" && err.code === 11000) {
    return res.status(400).json({ error: "username must be unique" });
  }

  // Handle JWT errors
  if (err.name === "JsonWebTokenError") {
    return res.status(401).json({ error: "Invalid token" });
  }

  if (err.name === "TokenExpiredError") {
    return res.status(401).json({ error: "Token expired" });
  }

  // Log the error for debugging (useful in development)
  console.error("Error details:", err);

  // Pass the error to the next middleware (in case others want to handle it)
  next(err);
};

/**
 * =============================================================================
 * extractToken - Extract JWT token from Authorization header
 * =============================================================================
 * 
 * This middleware extracts the JWT token from the HTTP request.
 * 
 * HOW IT WORKS:
 * 1. Look at the 'Authorization' header in the request
 * 2. Expected format: "Bearer <token>" 
 *    - "Bearer" is the authentication scheme
 *    - The token is everything after "Bearer "
 * 3. If token exists, attach it to request.token for use in routes
 * 4. If no token, request.token will be undefined (routes can check this)
 * 
 * WHY DO WE NEED THIS?
 * - JWT tokens are how we know WHO is making the request
 * - We can't just check username/password on every request
 * - Instead, the client sends this token, and we verify it
 * 
 * Example header:
 *   Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
 * 
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Next middleware function
 */
const extractToken = (req, res, next) => {
  // Get the Authorization header
  const authorization = req.get("authorization");
  
  // Check if header exists and starts with "Bearer "
  if (authorization && authorization.startsWith("Bearer ")) {
    // Extract the token (remove "Bearer " prefix)
    req.token = authorization.replace("Bearer ", "");
  } else {
    // No token provided - set to undefined
    req.token = undefined;
  }
  
  // Continue to the next middleware/route handler
  next();
};

// Export all middleware functions
module.exports = {
  unknownEndpoint,
  errorHandler,
  extractToken,
};

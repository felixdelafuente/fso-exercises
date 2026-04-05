/**
 * =============================================================================
 * USERS CONTROLLER - API Route Handlers for User Management
 * =============================================================================
 * 
 * This file defines all the API endpoints (routes) for working with users.
 * 
 * =============================================================================
 * WHAT IS A CONTROLLER?
 * =============================================================================
 * In the MVC (Model-View-Controller) pattern, controllers handle the "logic" part.
 * They:
 * 1. Receive incoming HTTP requests (from the client/frontend)
 * 2. Process the request (validate data, call models to interact with DB)
 * 3. Send back an HTTP response (JSON data, status codes)
 * 
 * Each function below corresponds to one API endpoint.
 * 
 * =============================================================================
 * AUTHENTICATION BASICS
 * =============================================================================
 * 
 * There are two main ways to handle authentication:
 * 1. Session-based (traditional): Server creates a session, stores it, gives client a cookie
 * 2. Token-based (modern): Server gives client a token (JWT), client sends token with each request
 * 
 * This implementation uses JWT (JSON Web Tokens) - a compact, URL-safe token format.
 * 
 * HOW JWT WORKS:
 * 1. User logs in with username/password
 * 2. Server verifies credentials
 * 3. Server creates a "signed" token containing user info
 * 4. Server sends token to client
 * 5. Client stores token (usually in localStorage or memory)
 * 6. Client sends token with each request (in Authorization header)
 * 7. Server verifies token signature to know WHO is making the request
 * 
 * =============================================================================
 */

const bcrypt = require("bcrypt");             // For hashing passwords (security)
const usersRouter = require("express").Router();  // Router object for defining routes
const User = require("../models/user");       // Import User model for database operations
const jwt = require("jsonwebtoken");           // For creating and verifying JWT tokens
const config = require("../utils/config");    // Configuration (includes SECRET key)

/**
 * =============================================================================
 * POST /api/users - Create a new user (Registration)
 * =============================================================================
 * 
 * This endpoint creates a new user account.
 * 
 * HOW IT WORKS:
 * 1. Extract username, name, and password from request body
 * 2. Validate that password is at least 3 characters (simple security check)
 * 3. Hash the password using bcrypt (NEVER store plain text passwords!)
 * 4. Create a new User document with the hashed password
 * 5. Save to database
 * 6. Return the created user (without password hash)
 * 
 * SECURITY NOTES:
 * - bcrypt.hash(password, saltRounds) creates a secure hash
 * - saltRounds = 10 is a good balance of security vs performance
 * - The hash is "one-way" - can't reverse it to get original password
 * - When logging in, we compare the plain password against the hash
 * 
 * REQUEST BODY EXAMPLE:
 * {
 *   "username": "johndoe",
 *   "name": "John Doe",
 *   "password": "secret123"
 * }
 * 
 * SUCCESS RESPONSE (201 Created):
 * {
 *   "id": "abc123",
 *   "username": "johndoe",
 *   "name": "John Doe"
 * }
 * 
 * ERROR RESPONSES:
 * - 400: Password too short (less than 3 chars)
 * - 400: Username already exists (MongoDB duplicate key error)
 * 
 */
usersRouter.post("/", async (request, response, next) => {
  try {
    // Extract data from request body
    const { username, name, password } = request.body;

    /**
     * PASSWORD VALIDATION
     * Simple check: password must be at least 3 characters
     * In a real app, you'd want stronger requirements:
     * - Minimum length (e.g., 8 chars)
     * - Require uppercase, lowercase, numbers, special chars
     */
    if (!password || password.length < 3) {
      return response
        .status(400)
        .json({ error: "password must be at least 3 characters" });
    }

    /**
     * PASSWORD HASHING
     * 
     * bcrypt is a password hashing function that:
     * 1. Adds a "salt" (random data) to the password
     * 2. Hashes the result multiple times (cost factor = 10)
     * 3. Returns a hash that can be stored safely
     * 
     * The result looks like: $2b$10$X7K9...
     * It contains both the salt and the hash, so we don't need to store salt separately.
     * 
     * WHY BCRYPT?
     * - Resistant to rainbow table attacks (pre-computed hash tables)
     * - Configurable work factor (can make it slower as computers get faster)
     * - Built-in salt handling
     */
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    // Create a new User document
    // Note: We DON'T include the password in the response (handled by toJSON)
    const user = new User({
      username,
      name,
      passwordHash,  // Store the hashed password, not plain text!
    });

    // Save to database
    const savedUser = await user.save();

    // Return the created user with status 201 (Created)
    response.status(201).json(savedUser);
  } catch (error) {
    // Pass errors to Express error handler middleware
    next(error);
  }
});

/**
 * =============================================================================
 * POST /api/users/login - User login (get JWT token)
 * =============================================================================
 * 
 * This endpoint authenticates a user and returns a JWT token.
 * 
 * HOW IT WORKS:
 * 1. Extract username and password from request body
 * 2. Find the user in the database by username
 * 3. Compare the submitted password with the stored hash
 * 4. If valid, create a JWT token with user info
 * 5. Return the token and user info
 * 
 * JWT TOKEN STRUCTURE:
 * The token contains three parts separated by dots:
 * - Header: { "alg": "HS256", "typ": "JWT" }
 * - Payload: { "username": "john", "id": "abc123", "iat": timestamp, "exp": timestamp }
 * - Signature: HMAC-SHA256 hash of header + payload + secret
 * 
 * The signature ensures the token can't be forged - only someone with the
 * SECRET key can create or modify the token.
 * 
 * REQUEST BODY EXAMPLE:
 * {
 *   "username": "johndoe",
 *   "password": "secret123"
 * }
 * 
 * SUCCESS RESPONSE (200 OK):
 * {
 *   "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
 *   "username": "johndoe",
 *   "name": "John Doe"
 * }
 * 
 * ERROR RESPONSES:
 * - 401: Invalid username or password
 * 
 */
usersRouter.post("/login", async (request, response, next) => {
  try {
    // Extract credentials from request body
    const { username, password } = request.body;

    /**
     * FIND USER
     * Look up the user by username in the database
     * If not found, user will be null
     */
    const user = await User.findOne({ username });

    /**
     * PASSWORD VERIFICATION
     * 
     * bcrypt.compare() does:
     * 1. Extract the salt from the stored hash
     * 2. Hash the provided password with that salt
     * 3. Compare the result with the stored hash
     * 
     * Returns true if password matches, false otherwise
     * 
     * We handle two failure cases:
     * 1. User doesn't exist (user === null)
     * 2. Password is wrong (passwordCorrect === false)
     */
    const passwordCorrect =
      user === null ? false : await bcrypt.compare(password, user.passwordHash);

    // If either user doesn't exist or password is wrong, return 401
    if (!user || !passwordCorrect) {
      return response.status(401).json({ error: "invalid username or password" });
    }

    /**
     * CREATE JWT TOKEN
     * 
     * jwt.sign() creates a new JSON Web Token
     * 
     * Parameters:
     * 1. Payload: Object containing data to encode in the token
     * 2. Secret: The SECRET key (from config.js) - used to sign the token
     * 3. Options: Configuration like expiration time
     * 
     * The payload typically includes:
     * - username: for display purposes
     * - id: for database lookups (finding the user)
     * 
     * Expiration (expiresIn):
     * - "1h" means the token expires in 1 hour
     * - After expiration, the client must login again
     * - This limits damage if a token is stolen
     */
    const userForToken = {
      username: user.username,
      id: user._id,
    };
    const token = jwt.sign(userForToken, config.SECRET, { expiresIn: "1h" });

    /**
     * RESPONSE
     * Return the token and basic user info
     * The client will store the token and send it with future requests
     */
    response.status(200).send({ token, username: user.username, name: user.name });
  } catch (error) {
    // Pass errors to Express error handler middleware
    next(error);
  }
});

/**
 * =============================================================================
 * GET /api/users - List all users (bonus endpoint)
 * =============================================================================
 * 
 * This endpoint returns all users (optionally with their blogs).
 * 
 * This is useful for:
 * - Admin dashboards
 * - Showing a list of all users
 * - Seeing who has created blogs
 * 
 * =============================================================================
 */
usersRouter.get("/", async (request, response, next) => {
  try {
    /**
     * .populate('blogs')
     * 
     * This replaces each blog ID in the user's blogs array
     * with the actual Blog document.
     * 
     * Without populate, you'd see:
     * { "username": "john", "blogs": ["abc123", "def456"] }
     * 
     * With populate, you see:
     * { "username": "john", "blogs": [{ "title": "My Post", ... }, ...] }
     * 
     * The second argument { username: 1, name: 1 } specifies which
     * fields to include from the populated User documents (in this case,
     * when viewing a user's blogs)
     */
    const users = await User.find({}).populate("blogs", {
      url: 1,
      title: 1,
      author: 1,
    });
    response.json(users);
  } catch (error) {
    next(error);
  }
});

/**
 * Export the router
 * 
 * This router will be mounted in app.js at /api/users
 * All routes defined here will be prefixed with /api/users
 * Example: POST /api/users, POST /api/users/login
 */
module.exports = usersRouter;

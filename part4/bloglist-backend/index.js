/**
 * =============================================================================
 * INDEX.JS - Application Entry Point / Server Starter
 * =============================================================================
 * 
 * This is the main entry point of our application.
 * When you run `node index.js` or `npm start`, execution starts here.
 * 
 * =============================================================================
 * WHAT DOES THIS FILE DO?
 * =============================================================================
 * 1. Imports the Express app (from app.js)
 * 2. Imports Mongoose (for MongoDB connection)
 * 3. Imports config (database URL, port, etc.)
 * 4. Connects to MongoDB database
 * 5. Starts the HTTP server
 * 
 * Think of it as: "The bootstrapper" - it sets everything up and starts the app.
 * 
 * =============================================================================
 * MONGOOSE & MONGODB
 * =============================================================================
 * 
 * Mongoose is an ODM (Object Data Mapper) for MongoDB.
 * 
 * What is MongoDB?
 * - A NoSQL (non-relational) database
 * - Stores data as JSON-like documents
 * - Flexible schema (no rigid table structure)
 * 
 * What is Mongoose?
 * - A library that sits between Node.js and MongoDB
 * - Provides schema definition
 * - Provides methods for querying (find, create, update, delete)
 * - Handles validation and type conversion
 * 
 * Key Mongoose Concepts:
 * - Connection: Link between your app and the database
 * - Schema: Blueprint defining what your data looks like
 * - Model: Schema compiled into a class for creating documents
 * - Document: A single record in the database
 * 
 * =============================================================================
 */

// Import the configured Express application
// This brings in all our routes, middleware, and settings
const app = require("./app");

// Import Mongoose - the MongoDB ODM (Object Data Mapper)
// We need this to connect to and interact with MongoDB
const mongoose = require("mongoose");

// Import configuration
// This gives us the database URL and server port
const config = require("./utils/config");

/**
 * =============================================================================
 * DATABASE CONNECTION & SERVER STARTUP
 * =============================================================================
 * 
 * This is the main async flow of starting our application:
 * 
 * 1. mongoose.connect() attempts to connect to MongoDB
 *    - Takes the MONGODB_URI from config
 *    - Returns a Promise
 * 
 * 2. .then() runs when connection succeeds
 *    - Logs "connected to MongoDB"
 *    - Starts listening for HTTP requests
 * 
 * 3. .catch() runs if connection fails
 *    - Logs the error
 *    - The server doesn't start if DB connection fails (correct behavior!)
 * 
 * =============================================================================
 */

// Connect to MongoDB using the URI from config
mongoose
  .connect(config.MONGODB_URI)
  .then(() => {
    // SUCCESS: Database connected!
    console.log("connected to MongoDB");

    /**
     * START THE HTTP SERVER
     * 
     * app.listen() starts an HTTP server on the specified port.
     * 
     * Parameters:
     * - config.PORT: The port number (usually 3001 for backend)
     * - callback: Function that runs when server starts
     * 
     * After this line, our API is live and can receive requests!
     */
    app.listen(config.PORT, () => {
      // Log a message so we know server started successfully
      console.log(`Server running on port ${config.PORT}`);
    });
  })
  .catch((err) => {
    // FAILURE: Database connection failed
    console.error(err);
    // We don't start the server - better to fail than run without DB!
  });

/**
 * =============================================================================
 * HOW TO RUN THIS APPLICATION
 * =============================================================================
 * 
 * Development mode (with auto-restart on changes):
 *   npm run dev
 * 
 * Production mode:
 *   npm start
 * 
 * Run tests:
 *   npm test
 * 
 * =============================================================================
 * 
 * NOTE: Before running, make sure you have:
 * 1. MongoDB installed and running locally OR
 * 2. A MongoDB Atlas connection string in your .env file
 * 3. A .env file with MONGODB_URI set
 * 
 * Example .env file:
 *   PORT=3001
 *   MONGODB_URI=mongodb://localhost:27017/bloglist
 *   SECRET=somereallylongsecretkey
 * 
 * =============================================================================
 */

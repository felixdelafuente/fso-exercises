/**
 * =============================================================================
 * CONFIG.JS - Application Configuration
 * =============================================================================
 * 
 * This file manages configuration settings for the application.
 * It uses environment variables with sensible defaults for development.
 * 
 * =============================================================================
 * WHAT IS .ENV FILES?
 * =============================================================================
 * Environment variables are variables that live outside your code but are
 * accessible to your application. They're commonly used for:
 * 
 * - Secrets (API keys, database passwords)
 * - Configuration (which database to use, port numbers)
 * - Environment-specific settings (dev vs production)
 * 
 * The .env file contains these variables in this format:
 *   PORT=3001
 *   MONGODB_URI=mongodb://localhost:27017/bloglist
 *   SECRET=mysecretkey
 * 
 * dotenv.config() loads these into process.env
 * 
 * =============================================================================
 * WHY USE ENVIRONMENT VARIABLES?
 * =============================================================================
 * 1. Security: Don't hardcode secrets in your code
 * 2. Flexibility: Different settings for dev/prod
 * 3. Portability: Same code works on different machines
 * 
 * =============================================================================
 */

require("dotenv").config();

/**
 * PORT - The port number the server will listen on
 * 
 * process.env.PORT: Value from environment variable
 * || 3001: Default fallback if not set
 * 
 * Common ports:
 * - 3000: Frontend (React, etc.)
 * - 3001: Backend API (our choice)
 * - 5000: Alternative backend port
 */
const PORT = process.env.PORT || 3001;

/**
 * MONGODB_URI - The connection string for MongoDB
 * 
 * This tells Mongoose how to connect to your MongoDB database.
 * 
 * Format: mongodb://[username:password@]host[:port]/[database]
 * 
 * Examples:
 * - mongodb://localhost:27017/bloglist (local database)
 * - mongodb+srv://user:pass@cluster.mongodb.net/bloglist (Atlas cloud)
 * 
 * CONDITIONAL LOGIC:
 * - If NODE_ENV === 'test', use TEST_MONGODB_URI
 * - Otherwise, use MONGODB_URI
 * 
 * This allows us to have separate databases for:
 * - Development (regular usage)
 * - Testing (running Jest tests without affecting dev data)
 */
const MONGODB_URI =
  process.env.NODE_ENV === "test"
    ? process.env.TEST_MONGODB_URI
    : process.env.MONGODB_URI;

/**
 * SECRET - The secret key used for signing JWT tokens
 * 
 * This is used by jsonwebtoken to:
 * - Sign tokens: Create new tokens that can't be forged
 * - Verify tokens: Check if a token is valid and not tampered with
 * 
 * The secret should be:
 * - Long and random (hard to guess)
 * - Kept secret (not committed to git!)
 * - Consistent across restarts (same key needed to verify tokens)
 * 
 * Default: "secretkey" (only for development!)
 * In production, ALWAYS set via environment variable
 */
const SECRET = process.env.SECRET || "secretkey";

// Export all configuration values
module.exports = { MONGODB_URI, PORT, SECRET };

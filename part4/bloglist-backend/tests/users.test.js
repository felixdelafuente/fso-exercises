/**
 * =============================================================================
 * USER TESTS - Comprehensive Test Suite for User API
 * =============================================================================
 * 
 * This file contains tests for the User API endpoints.
 * Tests use Jest as the test runner and Supertest for HTTP testing.
 * 
 * =============================================================================
 * WHAT IS TESTING?
 * =============================================================================
 * Testing is the practice of verifying that code works correctly.
 * 
 * WHY TEST?
 * 1. Catch bugs early - before users see them
 * 2. Ensure new changes don't break existing features (regression testing)
 * 3. Document how the code should behave
 * 4. Give confidence to refactor/change code
 * 
 * =============================================================================
 * JEST BASICS
 * =============================================================================
 * - describe(): Groups related tests together
 * - test(): Defines a single test case
 * - expect(): Makes assertions about values
 * - beforeEach(): Runs before each test
 * - afterAll(): Runs once after all tests
 * 
 * =============================================================================
 * SUPERTEST BASICS
 * =============================================================================
 * Supertest lets us test HTTP endpoints without running a real server.
 * 
 * key functions:
 * - supertest(app) - creates test client tied to our Express app
 * - .get() / .post() - make HTTP requests
 * - .expect(status) - assert expected status code
 * - .expect("Content-Type", /regex/) - assert Content-Type header
 * 
 * =============================================================================
 */

const mongoose = require("mongoose");
const supertest = require("supertest");
const app = require("../app");
const User = require("../models/user");
const bcrypt = require("bcrypt");

/**
 * Create test client from our Express app
 * 
 * supertest(app) creates a "fake" HTTP client that lets us
 * make requests to our app without actually starting a server.
 * 
 * We can think of it as:
 * - Real client: Browser -> HTTP Request -> Real Server -> Express App
 * - Test client: Test Code -> supertest(app) -> Express App (directly)
 * 
 * This is MUCH faster and doesn't require network setup!
 */
const api = supertest(app);

/**
 * =============================================================================
 * TEST SETUP - beforeEach
 * =============================================================================
 * 
 * beforeEach runs before EVERY test in this file.
 * We use it to reset the database to a known state.
 * 
 * This ensures each test starts with a clean slate,
 * so tests don't interfere with each other.
 * 
 * Think of it like: "Before each test, delete everything and set up fresh"
 * 
 * =============================================================================
 */
beforeEach(async () => {
  // Clear all users from the database
  // This ensures we start with a clean slate for each test
  await User.deleteMany({});

  /**
   * Create a test user
   * 
   * We create a "root" user that we can use in tests.
   * We hash the password with bcrypt (just like in the real app).
   * 
   * In tests, we often use known credentials:
   * - username: "root"
   * - password: "sekret"
   * 
   * This allows us to log in programmatically in tests.
   */
  const passwordHash = await bcrypt.hash("sekret", 10);
  const user = new User({ username: "root", passwordHash });
  await user.save();
});

/**
 * =============================================================================
 * TEST: POST /api/users - Create new user
 * =============================================================================
 * 
 * Tests the user registration endpoint.
 * 
 * WHAT WE'RE TESTING:
 * - Can create a new user with valid data
 * - Returns 201 (Created)
 * - Response is JSON
 * - User is actually saved to database
 * - Returns 2 users (the one from beforeEach + new one)
 * 
 * =============================================================================
 */
test("creation succeeds with fresh username", async () => {
  /**
   * Define the new user data
   * This simulates what a client would send when registering
   */
  const newUser = {
    username: "mluukkai",
    name: "Matti Luukkainen",
    password: "salainen",
  };

  /**
   * Make POST request to /api/users
   * 
   * Steps:
   * 1. Send the new user data
   * 2. Expect status 201 (Created - new resource was made)
   * 3. Expect Content-Type to be JSON
   */
  await api
    .post("/api/users")
    .send(newUser)
    .expect(201)
    .expect("Content-Type", /application\/json/);

  /**
   * Verify the user was actually saved to database
   * 
   * We query for all users and check:
   * - Should be 2 users now (root from beforeEach + new user)
   */
  const users = await User.find({});
  expect(users).toHaveLength(2);
});

/**
 * =============================================================================
 * TEST: POST /api/users - Duplicate username fails
 * =============================================================================
 * 
 * Tests that creating a user with an existing username fails.
 * 
 * WHAT WE'RE TESTING:
 * - Username field has unique: true constraint
 * - Trying to create duplicate username returns error
 * - Database still has only 1 user
 * 
 * =============================================================================
 */
test("creation fails with duplicate username", async () => {
  // Try to create a user with username "root" (already exists from beforeEach)
  const duplicateUser = {
    username: "root",
    name: "Duplicate User",
    password: "password123",
  };

  // Should fail with 400 (Bad Request)
  await api
    .post("/api/users")
    .send(duplicateUser)
    .expect(400);

  // Verify database still has only 1 user
  const users = await User.find({});
  expect(users).toHaveLength(1);
});

/*
 * =============================================================================
 * TEST: POST /api/users - Short password fails
 * =============================================================================
 * 
 * Tests that passwords must be at least 3 characters.
 * 
 * WHAT WE'RE TESTING:
 * - Our validation in users.js controller
 * - Passwords under 3 characters are rejected
 * 
 * =============================================================================
 */
test("creation fails with short password", async () => {
  const shortPasswordUser = {
    username: "newuser",
    name: "Short Password User",
    password: "ab",  // Only 2 characters - should fail
  };

  await api
    .post("/api/users")
    .send(shortPasswordUser)
    .expect(400);

  const users = await User.find({});
  expect(users).toHaveLength(1);  // Still only the root user
});

/**
 * =============================================================================
 * TEST: User toJSON removes passwordHash
 * =============================================================================
 * 
 * Tests that the password hash is not exposed in API responses.
 * 
 * WHAT WE'RE TESTING:
 * - Security: passwordHash should never be sent to clients
 * - The toJSON transform in user model
 * 
 * =============================================================================
 */
test("passwordHash is not returned in response", async () => {
  const newUser = {
    username: "securitytest",
    name: "Security Test",
    password: "testpassword",
  };

  const response = await api
    .post("/api/users")
    .send(newUser)
    .expect(201);

  // Check that passwordHash is NOT in the response
  expect(response.body.passwordHash).toBeUndefined();
  
  // But other fields should be present
  expect(response.body.username).toBe("securitytest");
  expect(response.body.name).toBe("Security Test");
  expect(response.body.id).toBeDefined();  // Our toJSON transforms _id to id
});

/**
 * =============================================================================
 * CLEANUP - afterAll
 * =============================================================================
 * 
 * afterAll runs once after all tests complete.
 * We use it to close the database connection.
 * 
 * WHY?
 * - Jest might hang if connections aren't closed
 * - Prevents "Jest did not exit" warning
 * - Clean shutdown of resources
 * 
 * =============================================================================
 */
afterAll(async () => {
  // Close the mongoose connection
  // This ensures all database connections are properly closed
  await mongoose.connection.close();
});

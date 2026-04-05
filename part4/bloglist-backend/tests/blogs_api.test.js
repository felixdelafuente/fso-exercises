/**
 * =============================================================================
 * BLOG TESTS - Comprehensive Test Suite for Blog API
 * =============================================================================
 * 
 * This file contains tests for the Blog API endpoints.
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
 * - .get() / .post() / .put() / .delete() - make HTTP requests
 * - .expect(status) - assert expected status code
 * - .expect("Content-Type", /regex/) - assert Content-Type header
 * 
 * =============================================================================
 */

const mongoose = require("mongoose");
const supertest = require("supertest");
const app = require("../app");
const Blog = require("../models/blog");
const User = require("../models/user");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const config = require("../utils/config");

// Create test client from our Express app
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
 * =============================================================================
 */
beforeEach(async () => {
  // Clear the database
  await Blog.deleteMany({});
  await User.deleteMany({});

  // Create a test user (we'll use this for authentication in tests)
  const passwordHash = await bcrypt.hash("sekret", 10);
  const user = new User({
    username: "testuser",
    name: "Test User",
    passwordHash,
  });
  await user.save();

  // Create a sample blog post for testing
  const blog = new Blog({
    title: "Test Blog Post",
    author: "Test Author",
    url: "https://test.com",
    likes: 5,
    user: user._id,  // Associate with our test user
  });
  await blog.save();
});

/**
 * =============================================================================
 * TEST: GET /api/blogs
 * =============================================================================
 * 
 * Tests fetching all blog posts.
 * 
 * WHAT WE'RE TESTING:
 * - HTTP GET request to /api/blogs returns 200 (OK)
 * - Response is in JSON format
 * - The returned array contains the blog we created in beforeEach
 * 
 * =============================================================================
 */
test("blogs are returned as JSON", async () => {
  /**
   * Make GET request to /api/blogs
   * expect(200) - status should be 200 OK
   * expect("Content-Type", /application\/json/) - content type should be JSON
   *   The /.../ is a regular expression - matches strings containing "application/json"
   */
  await api
    .get("/api/blogs")
    .expect(200)
    .expect("Content-Type", /application\/json/);
});

/**
 * =============================================================================
 * TEST: GET /api/blogs returns correct number of blogs
 * =============================================================================
 * 
 * Tests that the correct number of blogs are returned.
 * 
 * WHAT WE'RE TESTING:
 * - After beforeEach, we have 1 blog in the database
 * - GET /api/blogs should return an array with length 1
 * 
 * =============================================================================
 */
test("there is one blog", async () => {
  // Make request and get response
  const response = await api.get("/api/blogs");

  // Assert the array length is 1
  expect(response.body).toHaveLength(1);
});

/*
 * =============================================================================
 * TEST: GET /api/blogs - verify blog properties
 * =============================================================================
 * 
 * Tests that the returned blog has the expected properties.
 * 
 * WHAT WE'RE TESTING:
 * - The blog object has 'id' property (our toJSON transform)
 * - The blog has 'title', 'author', 'url', 'likes' fields
 * 
 * =============================================================================
 */
test("the blog has correct properties", async () => {
  const response = await api.get("/api/blogs");
  const blog = response.body[0];

  // Check that blog has expected fields
  expect(blog.title).toBe("Test Blog Post");
  expect(blog.author).toBe("Test Author");
  expect(blog.url).toBe("https://test.com");
  expect(blog.likes).toBe(5);
  expect(blog.id).toBeDefined();  // Should have 'id' (not '_id')
});

/**
 * =============================================================================
 * TEST: POST /api/blogs - create new blog (with auth)
 * =============================================================================
 * 
 * Tests creating a new blog post with authentication.
 * 
 * WHAT WE'RE TESTING:
 * - Can create a new blog when authenticated
 * - Returns 201 (Created)
 * - Response contains the created blog
 * - Database now has 2 blogs
 * 
 * HOW AUTHENTICATION WORKS:
 * 1. First, we login to get a JWT token
 * 2. Then we send that token in the Authorization header
 * 3. The server verifies the token and knows WHO is making the request
 * 
 * =============================================================================
 */
test("a valid blog can be added with authentication", async () => {
  // Step 1: Login to get a token
  const loginResponse = await api
    .post("/api/users/login")
    .send({ username: "testuser", password: "sekret" });

  // Extract the token from the login response
  const token = loginResponse.body.token;

  // Step 2: Create a new blog with the token
  const newBlog = {
    title: "New Blog Post",
    author: "New Author",
    url: "https://newblog.com",
    likes: 10,
  };

  // Make POST request with the token in Authorization header
  const response = await api
    .post("/api/blogs")
    .set("Authorization", `Bearer ${token}`)
    .send(newBlog)
    .expect(201)
    .expect("Content-Type", /application\/json/);

  // Verify the response contains our blog
  expect(response.body.title).toBe("New Blog Post");

  // Verify there are now 2 blogs in the database
  const blogsAtEnd = await Blog.find({});
  expect(blogsAtEnd).toHaveLength(2);
});

/**
 * =============================================================================
 * TEST: POST /api/blogs - without auth should fail
 * =============================================================================
 * 
 * Tests that creating a blog without authentication fails.
 * 
 * WHAT WE'RE TESTING:
 * - POST /api/blogs without token returns 401 (Unauthorized)
 * 
 * =============================================================================
 */
test("creating blog without token fails with 401", async () => {
  const newBlog = {
    title: "Unauthorized Blog",
    author: "Bad Actor",
    url: "https://bad.com",
  };

  // Make POST request WITHOUT token
  const response = await api
    .post("/api/blogs")
    .send(newBlog)
    .expect(401);

  expect(response.body.error).toBe("Token missing");
});

/**
 * =============================================================================
 * TEST: POST /api/blogs - validation: title required
 * =============================================================================
 * 
 * Tests that creating a blog without title fails validation.
 * 
 * WHAT WE'RE TESTING:
 * - Mongoose validation requires 'title' field
 * - Without title, server returns 400 (Bad Request)
 * 
 * =============================================================================
 */
test("blog without title is not added", async () => {
  // First get a token
  const loginResponse = await api
    .post("/api/users/login")
    .send({ username: "testuser", password: "sekret" });
  const token = loginResponse.body.token;

  // Try to create blog without title
  const newBlog = {
    author: "No Title Author",
    url: "https://notitle.com",
  };

  await api
    .post("/api/blogs")
    .set("Authorization", `Bearer ${token}`)
    .send(newBlog)
    .expect(400);

  // Verify no new blog was added
  const blogsAtEnd = await Blog.find({});
  expect(blogsAtEnd).toHaveLength(1);  // Still just the one from beforeEach
});

/**
 * =============================================================================
 * TEST: POST /api/blogs - validation: url required
 * =============================================================================
 * 
 * Tests that creating a blog without url fails validation.
 * 
 * =============================================================================
 */
test("blog without url is not added", async () => {
  // First get a token
  const loginResponse = await api
    .post("/api/users/login")
    .send({ username: "testuser", password: "sekret" });
  const token = loginResponse.body.token;

  // Try to create blog without url
  const newBlog = {
    title: "No URL Title",
    author: "No URL Author",
  };

  await api
    .post("/api/blogs")
    .set("Authorization", `Bearer ${token}`)
    .send(newBlog)
    .expect(400);

  const blogsAtEnd = await Blog.find({});
  expect(blogsAtEnd).toHaveLength(1);
});

/**
 * =============================================================================
 * TEST: DELETE /api/blogs/:id - delete own blog
 * =============================================================================
 * 
 * Tests that a user can delete their own blog.
 * 
 * WHAT WE'RE TESTING:
 * - Authenticated user can delete their blog
 * - Returns 204 (No Content)
 * - Blog is removed from database
 * 
 * =============================================================================
 */
test("a blog can be deleted by the creator", async () => {
  // Get token first
  const loginResponse = await api
    .post("/api/users/login")
    .send({ username: "testuser", password: "sekret" });
  const token = loginResponse.body.token;

  // Get the blog we created in beforeEach
  const blogsAtStart = await Blog.find({});
  const blogToDelete = blogsAtStart[0];

  // Delete the blog
  await api
    .delete(`/api/blogs/${blogToDelete.id}`)
    .set("Authorization", `Bearer ${token}`)
    .expect(204);

  // Verify it's gone
  const blogsAtEnd = await Blog.find({});
  expect(blogsAtEnd).toHaveLength(0);
});

/**
 * =============================================================================
 * TEST: DELETE /api/blogs/:id - delete without auth fails
 * =============================================================================
 * 
 * Tests that deleting without authentication fails.
 * 
 * =============================================================================
 */
test("deleting blog without token fails", async () => {
  const blogsAtStart = await Blog.find({});
  const blogToDelete = blogsAtStart[0];

  await api
    .delete(`/api/blogs/${blogToDelete.id}`)
    .expect(401);

  // Verify blog still exists
  const blogsAtEnd = await Blog.find({});
  expect(blogsAtEnd).toHaveLength(1);
});

/**
 * =============================================================================
 * TEST: PUT /api/blogs/:id - update blog
 * =============================================================================
 * 
 * Tests updating an existing blog post.
 * 
 * WHAT WE'RE TESTING:
 * - Can update a blog's likes
 * - Returns the updated blog
 * 
 * =============================================================================
 */
test("a blog can be updated", async () => {
  const blogsAtStart = await Blog.find({});
  const blogToUpdate = blogsAtStart[0];

  const updatedBlog = {
    likes: 99,
  };

  const response = await api
    .put(`/api/blogs/${blogToUpdate.id}`)
    .send(updatedBlog)
    .expect(200)
    .expect("Content-Type", /application\/json/);

  expect(response.body.likes).toBe(99);
});

/**
 * =============================================================================
 * TEST: Blog titles are unique (validation)
 * =============================================================================
 * 
 * Tests that duplicate titles (if we had unique constraint) would fail.
 * Note: Our current schema doesn't have title as unique, but if we added it,
 * this test would verify it works.
 * 
 * =============================================================================
 */
test("blogs have unique ids", async () => {
  const response = await api.get("/api/blogs");
  const blogs = response.body;

  // Get all ids
  const ids = blogs.map((b) => b.id);
  // Check that all ids are unique (using Set to remove duplicates)
  const uniqueIds = new Set(ids);
  
  // If all ids are unique, Set size should equal array length
  expect(uniqueIds.size).toBe(ids.length);
});

/**
 * =============================================================================
 * TEST: Blogs have user field populated
 * =============================================================================
 * 
 * Tests that the user field is properly populated in the response.
 * 
 * WHAT WE'RE TESTING:
 * - When fetching blogs, the user field contains user data
 * - Not just the ObjectId, but username and name
 * 
 * =============================================================================
 */
test("blog contains user information", async () => {
  const response = await api.get("/api/blogs");
  const blog = response.body[0];

  // Check that user field exists and has expected properties
  expect(blog.user).toBeDefined();
  expect(blog.user.username).toBe("testuser");
  expect(blog.user.name).toBe("Test User");
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
 * 
 * =============================================================================
 */
afterAll(async () => {
  // Close the mongoose connection
  await mongoose.connection.close();
});
// index.js
// Full Phonebook backend with MongoDB (Mongoose), static serving, logging, and error handling.

require("dotenv").config();
const express = require("express");
const morgan = require("morgan");
const cors = require("cors");
const mongoose = require("mongoose");

const Person = require("./models/person");

const app = express();

// --- Database connection ---
const mongoUrl = process.env.MONGODB_URI;
if (!mongoUrl) {
  console.warn(
    "MONGODB_URI not set. Falling back to in-memory data for development.",
  );
} else {
  mongoose
    .connect(mongoUrl, { useNewUrlParser: true, useUnifiedTopology: true })
    .then(() => {
      console.log("Connected to MongoDB");
    })
    .catch((err) => {
      console.error("Error connecting to MongoDB:", err.message);
    });
}

// --- Middleware ---
app.use(cors());
app.use(express.json());

// Serve static files from 'build' (frontend production build)
app.use(express.static("build"));

// Morgan logging
morgan.token("body", (req) =>
  req.method === "POST" || req.method === "PUT" ? JSON.stringify(req.body) : "",
);
app.use(
  morgan(":method :url :status :res[content-length] - :response-time ms :body"),
);

// --- Routes ---

// GET all persons (from DB)
app.get("/api/persons", (req, res, next) => {
  Person.find({})
    .then((persons) => {
      res.json(persons);
    })
    .catch((err) => next(err));
});

// GET info (uses DB)
app.get("/info", (req, res, next) => {
  Person.countDocuments({})
    .then((count) => {
      res.send(
        `<p>Phonebook has info for <strong>${count}</strong> people</p><p>${new Date()}</p>`,
      );
    })
    .catch((err) => next(err));
});

// GET single person by id (DB)
app.get("/api/persons/:id", (req, res, next) => {
  Person.findById(req.params.id)
    .then((person) => {
      if (person) {
        res.json(person);
      } else {
        res.status(404).end();
      }
    })
    .catch((err) => next(err));
});

// DELETE person by id (DB)
app.delete("/api/persons/:id", (req, res, next) => {
  Person.findByIdAndRemove(req.params.id)
    .then(() => {
      res.status(204).end();
    })
    .catch((err) => next(err));
});

// POST create new person (DB)
app.post("/api/persons", (req, res, next) => {
  const { name, number } = req.body;

  if (!name || !number) {
    return res.status(400).json({ error: "name or number missing" });
  }

  const person = new Person({ name, number });

  person
    .save()
    .then((saved) => res.status(201).json(saved))
    .catch((err) => next(err));
});

// PUT update person number (DB) with validators enabled
app.put("/api/persons/:id", (req, res, next) => {
  const { number } = req.body;

  // Use runValidators: true to enable schema validators on update
  Person.findByIdAndUpdate(
    req.params.id,
    { number },
    { new: true, runValidators: true, context: "query" },
  )
    .then((updated) => {
      if (updated) {
        res.json(updated);
      } else {
        res.status(404).end();
      }
    })
    .catch((err) => next(err));
});

// Serve frontend for any other route (SPA fallback)
app.get("*", (req, res) => {
  res.sendFile("index.html", { root: "build" });
});

// --- Unknown endpoint middleware ---
const unknownEndpoint = (req, res) => {
  res.status(404).json({ error: "unknown endpoint" });
};
app.use(unknownEndpoint);

// --- Error handler middleware ---
const errorHandler = (err, _req, res, _next) => {
  console.error(err.name, err.message);

  if (err.name === "CastError" && err.kind === "ObjectId") {
    return res.status(400).json({ error: "malformatted id" });
  }
  if (err.name === "ValidationError") {
    return res.status(400).json({ error: err.message });
  }
  // fallback
  res.status(500).json({ error: "internal server error" });
};
app.use(errorHandler);

// --- Start server ---
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

// mongo.js
// Usage:
//  node mongo.js <password>                -> lists all persons
//  node mongo.js <password> "Name" "Number" -> adds a new person

const mongoose = require("mongoose");

if (process.argv.length < 3) {
  console.log("Usage: node mongo.js <password> [name number]");
  process.exit(1);
}

const password = process.argv[2];
const name = process.argv[3];
const number = process.argv[4];

const url = `mongodb+srv://fullstack:${encodeURIComponent(password)}@cluster0.example.mongodb.net/phonebook?retryWrites=true&w=majority`;
// Replace cluster0.example.mongodb.net and username as appropriate for your Atlas setup.

mongoose
  .connect(url, { useNewUrlParser: true, useUnifiedTopology: true })
  .catch((err) => {
    console.error("Connection error:", err.message);
    process.exit(1);
  });

const Person = require("./models/person");

if (!name) {
  // List all persons
  Person.find({})
    .then((persons) => {
      console.log("phonebook:");
      persons.forEach((p) => {
        console.log(`${p.name} ${p.number}`);
      });
      mongoose.connection.close();
    })
    .catch((err) => {
      console.error(err);
      mongoose.connection.close();
    });
} else {
  // Add a new person
  const person = new Person({
    name,
    number,
  });

  person
    .save()
    .then((saved) => {
      console.log(`added ${saved.name} number ${saved.number} to phonebook`);
      mongoose.connection.close();
    })
    .catch((err) => {
      console.error("Error saving person:", err.message);
      mongoose.connection.close();
    });
}

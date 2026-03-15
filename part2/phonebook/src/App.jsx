import { useState, useEffect } from "react";
import PersonForm from "./components/PersonForm";
import Persons from "./components/Persons";
import Filter from "./components/Filter";
import Notification from "./components/Notification";
import personService from "./services/persons";

const App = () => {
  // State variables
  const [persons, setPersons] = useState([]);
  const [newName, setNewName] = useState("");
  const [newNumber, setNewNumber] = useState("");
  const [filter, setFilter] = useState("");
  const [message, setMessage] = useState(null); // 🔹 Notification state

  // Fetch initial data
  useEffect(() => {
    personService.getAll().then((initialPersons) => {
      setPersons(initialPersons);
    });
  }, []);

  // Add or update person
  const addPerson = (event) => {
    event.preventDefault();
    const personObject = { name: newName, number: newNumber };

    const existing = persons.find((p) => p.name === newName);
    if (existing) {
      if (
        window.confirm(`${newName} is already added. Replace the old number?`)
      ) {
        personService
          .update(existing.id, { ...existing, number: newNumber })
          .then((returnedPerson) => {
            setPersons(
              persons.map((p) => (p.id !== existing.id ? p : returnedPerson)),
            );
            showMessage(`Updated ${newName}`, "success");
            setNewName("");
            setNewNumber("");
          })
          .catch((error) => {
            showMessage(
              `Information of ${newName} has already been removed from server`,
              "error",
            );
            console.error("Update failed:", error);
            setPersons(persons.filter((p) => p.id !== existing.id));
          });
      }
    } else {
      personService.create(personObject).then((returnedPerson) => {
        setPersons(persons.concat(returnedPerson));
        showMessage(`Added ${newName}`, "success");
        setNewName("");
        setNewNumber("");
      });
    }
  };

  // Delete person
  const deletePerson = (id) => {
    const person = persons.find((p) => p.id === id);
    if (window.confirm(`Delete ${person.name}?`)) {
      personService
        .remove(id)
        .then(() => {
          setPersons(persons.filter((p) => p.id !== id));
          showMessage(`Deleted ${person.name}`, "success");
        })
        .catch((error) => {
          showMessage(
            `Information of ${person.name} has already been removed from server`,
            "error",
          );
          console.error("Delete failed:", error);
          setPersons(persons.filter((p) => p.id !== id));
        });
    }
  };

  // 🔹 Helper to show notifications temporarily
  const showMessage = (text, type) => {
    setMessage({ text, type });
    setTimeout(() => {
      setMessage(null);
    }, 5000); // message disappears after 5s
  };

  // Controlled input handlers
  const handleNameChange = (event) => setNewName(event.target.value);
  const handleNumberChange = (event) => setNewNumber(event.target.value);
  const handleFilterChange = (event) => setFilter(event.target.value);

  // Derived data
  const personsToShow = filter
    ? persons.filter((p) => p.name.toLowerCase().includes(filter.toLowerCase()))
    : persons;

  return (
    <div>
      <h2>Phonebook</h2>
      {/* 🔹 Notification component */}
      <Notification message={message} />

      <Filter value={filter} onChange={handleFilterChange} />

      <h3>Add a new</h3>
      <PersonForm
        onSubmit={addPerson}
        newName={newName}
        handleNameChange={handleNameChange}
        newNumber={newNumber}
        handleNumberChange={handleNumberChange}
      />

      <h3>Numbers</h3>
      <Persons persons={personsToShow} onDelete={deletePerson} />
    </div>
  );
};

export default App;

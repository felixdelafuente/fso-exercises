import { useState, useEffect } from "react";
import axios from "axios";
import CountryList from "./components/CountryList";
import Country from "./components/Country";

const App = () => {
  const [countries, setCountries] = useState([]); // all countries from API
  const [filter, setFilter] = useState(""); // search input

  // 🔹 Fetch all countries once on mount (Exercise 2.18)
  // Using Helsinki endpoint to avoid "fields" error
  useEffect(() => {
    axios
      .get("https://studies.cs.helsinki.fi/restcountries/api/all")
      .then((response) => {
        setCountries(response.data);
      });
  }, []);

  // 🔹 Controlled input handler
  const handleFilterChange = (event) => setFilter(event.target.value);

  // 🔹 Derived data: filter countries by name
  const countriesToShow = filter
    ? countries.filter((c) =>
        c.name.common.toLowerCase().includes(filter.toLowerCase()),
      )
    : [];

  return (
    <div>
      <h2>Find countries</h2>
      <input value={filter} onChange={handleFilterChange} />

      {/* Conditional rendering based on matches */}
      {countriesToShow.length > 10 && (
        <p>Too many matches, specify another filter</p>
      )}
      {countriesToShow.length > 1 && (
        <CountryList countries={countriesToShow} setFilter={setFilter} />
      )}
      {countriesToShow.length === 1 && <Country country={countriesToShow[0]} />}
    </div>
  );
};

export default App;

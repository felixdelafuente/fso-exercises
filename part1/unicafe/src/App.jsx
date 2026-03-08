/**
 * Unicafe Feedback App
 * ---------------------
 * Purpose:
 *   Collect feedback (good, neutral, bad) and display statistics.
 *
 * Key Concepts:
 *   - Multiple useState hooks for counters
 *   - Derived values (total, average, positive %)
 *   - Conditional rendering ("No feedback given")
 *   - Component composition (Button, Statistics)
 */

import React, { useState } from "react";

// Reusable Button component
const Button = ({ handleClick, text }) => (
  <button onClick={handleClick}>{text}</button>
);

// StatisticLine for displaying a single row
const StatisticLine = ({ text, value }) => (
  <tr>
    <td>{text}</td>
    <td>{value}</td>
  </tr>
);

// Statistics component
const Statistics = ({ good, neutral, bad }) => {
  const total = good + neutral + bad;
  const average = total === 0 ? 0 : (good - bad) / total;
  const positive = total === 0 ? 0 : (good / total) * 100;

  if (total === 0) {
    return <p>No feedback given</p>;
  }

  return (
    <table>
      <tbody>
        <StatisticLine text='Good' value={good} />
        <StatisticLine text='Neutral' value={neutral} />
        <StatisticLine text='Bad' value={bad} />
        <StatisticLine text='All' value={total} />
        <StatisticLine text='Average' value={average.toFixed(2)} />
        <StatisticLine text='Positive' value={positive.toFixed(1) + " %"} />
      </tbody>
    </table>
  );
};

function App() {
  // State hooks for feedback counts
  const [good, setGood] = useState(0);
  const [neutral, setNeutral] = useState(0);
  const [bad, setBad] = useState(0);

  return (
    <div>
      <h1>Give Feedback</h1>
      <Button handleClick={() => setGood(good + 1)} text='Good' />
      <Button handleClick={() => setNeutral(neutral + 1)} text='Neutral' />
      <Button handleClick={() => setBad(bad + 1)} text='Bad' />

      <h2>Statistics</h2>
      <Statistics good={good} neutral={neutral} bad={bad} />
    </div>
  );
}

export default App;

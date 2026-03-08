/**
 * Anecdotes Voting App
 * ---------------------
 * Purpose:
 *   Display random anecdotes and allow voting.
 *
 * Key Concepts:
 *   - useState for current anecdote index
 *   - useState for votes array
 *   - Immutable array updates
 *   - Derived value: anecdote with most votes
 */

import React, { useState } from "react";

const anecdotes = [
  "If it hurts, do it more often.",
  "Adding manpower to a late software project makes it later!",
  "The first 90 percent of the code accounts for the first 90 percent of the development time...",
  "Any fool can write code that a computer can understand. Good programmers write code that humans can understand.",
  "Premature optimization is the root of all evil.",
  "Debugging is twice as hard as writing the code in the first place.",
];

function App() {
  const [selected, setSelected] = useState(0);
  const [votes, setVotes] = useState(new Array(anecdotes.length).fill(0));

  // Vote handler
  const voteAnecdote = () => {
    const newVotes = [...votes];
    newVotes[selected] += 1;
    setVotes(newVotes);
  };

  // Random anecdote handler
  const nextAnecdote = () => {
    const randomIndex = Math.floor(Math.random() * anecdotes.length);
    setSelected(randomIndex);
  };

  // Find anecdote with most votes
  const maxVotes = Math.max(...votes);
  const topAnecdoteIndex = votes.indexOf(maxVotes);

  return (
    <div>
      <h1>Anecdote of the day</h1>
      <p>{anecdotes[selected]}</p>
      <p>has {votes[selected]} votes</p>
      <button onClick={voteAnecdote}>Vote</button>
      <button onClick={nextAnecdote}>Next Anecdote</button>

      <h2>Anecdote with most votes</h2>
      {maxVotes === 0 ? (
        <p>No votes yet</p>
      ) : (
        <div>
          <p>{anecdotes[topAnecdoteIndex]}</p>
          <p>has {maxVotes} votes</p>
        </div>
      )}
    </div>
  );
}

export default App;

// App.jsx

/**
 * Header component
 * ----------------
 * Displays the course name.
 * Props:
 *   - course: string
 */
const Header = ({ course }) => {
  return <h1>{course}</h1>;
};

/**
 * Part component
 * --------------
 * Displays a single part of the course and its exercise count.
 * Props:
 *   - part: string
 *   - exercises: number
 */
const Part = ({ part, exercises }) => {
  return (
    <p>
      {part} {exercises}
    </p>
  );
};

/**
 * Content component
 * -----------------
 * Renders all parts of the course.
 * Props:
 *   - parts: array of objects [{ name, exercises }]
 *
 * Uses Array.map to loop through parts and render <Part>.
 */
const Content = ({ parts }) => {
  return (
    <div>
      {parts.map((p, index) => (
        <Part key={index} part={p.name} exercises={p.exercises} />
      ))}
    </div>
  );
};

/**
 * Total component
 * ---------------
 * Calculates and displays the total number of exercises.
 * Props:
 *   - parts: array of objects [{ name, exercises }]
 *
 * Uses Array.reduce to sum exercises.
 */
const Total = ({ parts }) => {
  const total = parts.reduce((sum, p) => sum + p.exercises, 0);
  return <p>Number of exercises {total}</p>;
};

/**
 * App component
 * -------------
 * Root component of the application.
 * Holds the course data as an object with:
 *   - name: string
 *   - parts: array of objects
 *
 * Passes data down to Header, Content, and Total.
 */
const App = () => {
  const course = {
    name: "Half Stack application development",
    parts: [
      { name: "Fundamentals of React", exercises: 10 },
      { name: "Using props to pass data", exercises: 7 },
      { name: "State of a component", exercises: 14 },
    ],
  };

  return (
    <div>
      {/* Display course name */}
      <Header course={course.name} />

      {/* Display parts and exercises */}
      <Content parts={course.parts} />

      {/* Display total exercises */}
      <Total parts={course.parts} />
    </div>
  );
};

export default App;

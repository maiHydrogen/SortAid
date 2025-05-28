import { useState } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import './App.css'

function App() {

  return (
    <>
      <div class="container">
        <h1>Scholarship Finder</h1>
        <form id="scholarshipform">
            <input type="text" name="course" placeholder="Course of Study" required />
            <input type="text" name="cgpa" placeholder="Grades" required />
            <input type="text" name="location" placeholder="Location" required />
            <input type="text" name="income" placeholder="Income Status" required />
            <input type="text" name="interests" placeholder="Interests" required />
            <button type="submit">Find Scholarship</button>
        </form>
        <div id="results"></div>
    </div>
    </>
  )
}

export default App

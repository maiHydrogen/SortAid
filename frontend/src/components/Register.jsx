import React, { useState ,useContext} from "react";
import { useNavigate } from "react-router-dom";
import { UserContext } from "./UserContext";
import { Link } from "react-router-dom";
import "./Register.css";

const Register = ({ onRegister }) => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [grades, setGrades] = useState("");
  const [location, setLocation] = useState("");
  const [course, setCourse] = useState("");
  const [password, setPassword] = useState("");

  const navigate = useNavigate();
  const{setUser}=useContext(UserContext);

  const handleSubmit = async (e) => {
  e.preventDefault();

  const userdata = {
    name,
    email,
    password,
    gpa: grades,
    location,
    course,
  };
  try {
    console.log("sending data to backend",userdata);
    const response = await fetch("http://localhost:8000/api/profile/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(userdata),
    });

    const data = await response.json();
    console.log("backend response",data);
    if (response.ok) {
      setUser(userdata);
      onRegister();
      navigate("/home");
    } else {
      alert(data.error || "Registration failed");
    }
  } catch (error) {
    console.error("Registration error:", error);
    alert("Server error during registration");
  }
  axios.post('http://localhost:8000/api/profile', {
  userId: email,
  gpa: grades,
  course,
  location,
  interests: [],
});
};

  return (
    <>
    <div className="heading">
      <h1>Don't have an account ?</h1>
      <h1>No Worries, Register Now !</h1>
      <p>Please provide the following details to register</p>
    </div>
    <div className="register-container">
      <form onSubmit={handleSubmit} className="register-form">
        <input
          type="text"
          placeholder="Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <input
          type="grades"
          placeholder="GPA"
          value={grades}
          onChange={(e) => setGrades(e.target.value)}
          required
        />
        <input
          type="location"
          placeholder="Location"
          value={location}
          onChange={(e) => setLocation(e.target.value)}
          required
        />
        <input
          type="course"
          placeholder="Course"
          value={course}
          onChange={(e) => setCourse(e.target.value)}
          required
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        <button type="submit">Register</button>
      </form>
      <p>Already have an account ? <Link to="/login">Login</Link></p>
    </div>
    </>
  );
};

export default Register;
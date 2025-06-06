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

  const handleSubmit = (e) => {
    e.preventDefault();
    const userdata ={
      name,email,password,grades,location,course,
    };
    setUser(userdata);
    onRegister();
    navigate("/home");
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
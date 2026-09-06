import Navbar from './components/Navbar';
import Login from './components/Login';
import Register from './components/Register';
import Profile from './components/Profile';
import ScholarshipList from './components/ScholarshipList';
import AboutUs from './components/AboutUs';
import AdminPage from './components/AdminPage';
import { useState } from 'react';
import { Route ,Routes , Navigate } from 'react-router-dom'
import HomePage from './components/HomePage';

function App() {
  const[isAuthenticated,setisAuthenticated]=useState(() => Boolean(localStorage.getItem("userId")));
  const[isAdmin,setIsAdmin]=useState(() => localStorage.getItem("isAdmin") === "true");

  const handleAuthed = () => {
    setisAuthenticated(true);
    setIsAdmin(localStorage.getItem("isAdmin") === "true");
  };

  return (
    <>
      <Navbar isAuthenticated={isAuthenticated} isAdmin={isAdmin}/>
      <Routes>
      <Route path="/" element={<Navigate to="/home"/>}/>
      <Route path='/login' element={<Login onLogin={handleAuthed}/>}/>
      <Route path='/register' element={<Register onRegister={handleAuthed}/>}/>
      <Route path='/home' element={<HomePage/>}/>
      <Route path='/about' element={<AboutUs/>}/>
      <Route path='/scholarships' element={isAuthenticated ? <ScholarshipList/> : <Navigate to="/login"/>}/>
      <Route path='/profile' element={isAuthenticated ? <Profile/> : <Navigate to="/login"/>}/>
      <Route path='/admin' element={isAuthenticated && isAdmin ? <AdminPage/> : <Navigate to="/home"/>}/>
     </Routes>
    </>
  )
}

export default App

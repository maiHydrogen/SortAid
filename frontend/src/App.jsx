import Navbar from './components/Navbar';
import Login from './components/Login';
import Register from './components/Register';
import Profile from './components/Profile';
import ScholarshipList from './components/ScholarshipList';
import AboutUs from './components/AboutUs';
import { useState } from 'react';
import { Route ,Routes , Navigate } from 'react-router-dom'
import HomePage from './components/HomePage';

function App() {
  const[isAuthenticated,setisAuthenticated]=useState(() => Boolean(localStorage.getItem("userId")));
  return (
    <>
      <Navbar isAuthenticated={isAuthenticated}/>
      <Routes>
      <Route path="/" element={<Navigate to="/home"/>}/>
      <Route path='/login' element={<Login onLogin={()=>setisAuthenticated(true)}/>}/>
      <Route path='/register' element={<Register onRegister={()=>setisAuthenticated(true)}/>}/>
      <Route path='/home' element={<HomePage/>}/>
      <Route path='/about' element={<AboutUs/>}/>
      <Route path='/scholarships' element={isAuthenticated ? <ScholarshipList/> : <Navigate to="/login"/>}/>
      <Route path='/profile' element={isAuthenticated ? <Profile/> : <Navigate to="/login"/>}/>
     </Routes>
    </>
  )
}

export default App

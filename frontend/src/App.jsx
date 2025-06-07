import Navbar from './components/Navbar';
import Login from './components/Login';
import Register from './components/Register';
import Profile from './components/Profile';
import ScholarshipList from './components/ScholarshipList';
import React , {useState} from 'react';
import { Router ,Route ,Routes , Navigate } from 'react-router-dom'
import HomePage from './components/HomePage';

function App() {
  const[isAuthenticated,setisAuthenticated]=useState(false);
  return (
    <>
      <Navbar isAuthenticated={isAuthenticated}/>
      <Routes>
      <Route path="/" element={<Navigate to="/home"/>}/>
      <Route path='/login' element={<Login onLogin={()=>setisAuthenticated(true)}/>}/>
      <Route path='/register' element={<Register onRegister={()=>setisAuthenticated(true)}/>}/>
      <Route path='/home' element={<HomePage/>}/> 
      <Route path='/scholarships' element={isAuthenticated ? <ScholarshipList/> : <Navigate to="/login"/>}/>
      <Route path='/profile' element={<Profile/>}/>
     </Routes>
    </>
  )
}

export default App

import { useState } from 'react'
import heroImg from './assets/hero.png'
import reactLogo from './assets/react.svg'
import viteLogo from './assets/vite.svg'
import Login from './auth /components/Login';
import Layout from './dashboard/components/Layout';
import './App.css'

function App() {
  const [isAuth, setIsAuth] = useState(false);

  if(!isAuth){
    return <Login onLoginSuccess ={()=> setIsAuth(true)} />
  }


  return (
    <Layout onLogout={() => setIsAuth(false)} />
  )
}

export default App

import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import store from './store/store.js'
import {Provider} from "react-redux"
import {RouterProvider,createBrowserRouter} from "react-router-dom"
import Dashboard from './components/Dashboard.jsx'
import Protected from './components/AuthLayout.jsx'
import DriverDashboard from './components/DriverDashboard.jsx'
import Login from './components/Login.jsx'
import Signup from './components/Signup.jsx'
import MyProfile from './components/MyProfile.jsx'
import RideHistory from './components/RideHistory.jsx'

const router=createBrowserRouter([{
  element: <App />,
  children: [
  {
    index: true,
    element: (
        <Protected authentication={true} allowedRole="rider">
            <Dashboard />
            
        </Protected>
    ),
},
{
    path: "profile",
    element: (
          <Protected>
              <MyProfile />
          </Protected>
    ),
},
{
    path: "ride-history",
    element: (
          <Protected>
              <RideHistory />
          </Protected>
    ),
},
{
    path: "driver/dashboard",
    element: (
        <Protected authentication={true} allowedRole="driver">
            <DriverDashboard />
        </Protected>
    ),
},
{
    path: "login",
    element: (
        <Protected authentication={false}>
            <Login />
        </Protected>
    ),
},
{
    path: "signup",
    element: (
        <Protected authentication={false}>
            <Signup />
        </Protected>
    ),
},
  ],
}])

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <Provider store={store}>
    <RouterProvider router={router}/>
    </Provider>
  </StrictMode>,
)

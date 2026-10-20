import { useState, useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import './App.css'

import {login, logout} from "./store/authSlice"

import { Outlet } from 'react-router-dom'
import axios from "axios"
import {socket} from './services/socket.js'
import { apiUrl } from "./services/api.js";

function App() {
  const [loading, setLoading] = useState(true)
  const dispatch = useDispatch()
  const authStatus = useSelector((state) => state.auth.status)

  useEffect(() => {
    const role = localStorage.getItem("role")
      const controller = new AbortController();
      const getUser = async () => {
          if (role !== "rider" && role !== "driver") {
              dispatch(logout());
            setLoading(false);
            return;
        }

        try {
            const accountType = role === "driver" ? "driver" : "user";
            const response = await axios.get(
          apiUrl(`${accountType}/get-current-user`),
          { withCredentials: true, signal: controller.signal }
            );

            if (response.data?.data) {
                dispatch(login(response.data.data));
            } else {
                dispatch(logout());
            }
        } catch (error) {
            if (!axios.isCancel(error)) {
                dispatch(logout());
                localStorage.removeItem("role");
            }
        } finally {
            if (!controller.signal.aborted) {
                setLoading(false);
            }
        }
    };

    getUser();
    return () => controller.abort();
}, [dispatch]);

  useEffect(() => {
    if (loading) return

    if (authStatus) {
      if (!socket.connected) socket.connect()
    } else {
      socket.disconnect()
    }
  }, [authStatus, loading])
  
  return !loading ? (
    <main className="min-h-screen">
      <Outlet />
    </main>
  ) : null
}

export default App
import { io } from "socket.io-client";
import { socketUrl, getAuthTokenFromCookies } from "./api.js";

export const socket = io(socketUrl(), {
  autoConnect: false,
  withCredentials: true,
  auth: (callback) => {
    callback({
      accessToken: getAuthTokenFromCookies("driver"),
    });
  },
});
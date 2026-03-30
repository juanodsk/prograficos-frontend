import { io } from "socket.io-client";

let socketInstance = null;

const socketUrl = import.meta.env.VITE_SOCKET_URL || "http://localhost:5001";
const socketPath = import.meta.env.VITE_SOCKET_PATH || "/socket.io";

const getSocket = () => {
  if (!socketInstance) {
    socketInstance = io(socketUrl, {
      path: socketPath,
      transports: ["websocket", "polling"],
      withCredentials: true,
      autoConnect: false,
    });
  }

  return socketInstance;
};

const connectSocket = () => {
  const socket = getSocket();

  if (!socket.connected) {
    socket.connect();
  }

  return socket;
};

const disconnectSocket = () => {
  if (socketInstance?.connected) {
    socketInstance.disconnect();
  }
};

export { connectSocket, disconnectSocket, getSocket };

import { io } from "socket.io-client";

let socketInstance = null;

const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:5001";

const resolveSocketConfig = () => {
  const explicitUrl = import.meta.env.VITE_SOCKET_URL;
  const explicitPath = import.meta.env.VITE_SOCKET_PATH;

  try {
    const parsedApiUrl = new URL(apiUrl);
    const basePath =
      parsedApiUrl.pathname && parsedApiUrl.pathname !== "/"
        ? parsedApiUrl.pathname.replace(/\/$/, "")
        : "";

    return {
      url:
        explicitUrl || `${parsedApiUrl.protocol}//${parsedApiUrl.host}`,
      path: explicitPath || `${basePath}/socket.io`,
    };
  } catch {
    return {
      url: explicitUrl || "http://localhost:5001",
      path: explicitPath || "/socket.io",
    };
  }
};

const { url: socketUrl, path: socketPath } = resolveSocketConfig();

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

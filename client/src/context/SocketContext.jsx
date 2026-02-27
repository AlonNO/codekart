import { createContext, useContext, useState } from 'react';
import { io } from 'socket.io-client';

const SERVER_URL = 'http://localhost:3001';
const SocketContext = createContext(null);

export function SocketProvider({ children }) {
  const [socket, setSocket] = useState(null);

  const connectSocket = () => {
    if (socket && socket.connected) return socket;

    const newSocket = io(SERVER_URL, {
      forceNew: true,
    });

    newSocket.on('connect', () => {
      console.log('🔌 Connected:', newSocket.id);
    });

    setSocket(newSocket);
    return newSocket;
  };

  return (
    <SocketContext.Provider value={{ socket, connectSocket }}>
      {children}
    </SocketContext.Provider>
  );
}

export function useSocket() {
  return useContext(SocketContext);
}
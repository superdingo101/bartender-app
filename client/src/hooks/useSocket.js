import { useEffect, useState } from 'react';
import { io } from 'socket.io-client';

const SOCKET_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

export const useSocket = (token) => {
  const [socket, setSocket] = useState(null);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    console.log('🔌 Creating Socket.IO connection');

    const socketInstance = io(SOCKET_URL, {
      ...(token && { auth: { token } }),
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: 5,
    });

    socketInstance.on('connect', () => {
      console.log('✅ Connected to Socket.IO');
      setConnected(true);
    });

    socketInstance.on('disconnect', () => {
      console.log('❌ Disconnected from Socket.IO');
      setConnected(false);
    });

    socketInstance.on('error', (error) => {
      console.error('❌ Socket error:', error);
    });

    socketInstance.on('connect_error', (error) => {
      console.error('❌ Socket connection error:', error);
      console.error('Error message:', error.message);
      console.error('Error data:', error.data);
    });

    setSocket(socketInstance);

    return () => {
      console.log('🧹 Cleaning up Socket.IO connection');
      socketInstance.disconnect();
    };
  }, [token]);

  return { socket, connected };
};

export default useSocket;
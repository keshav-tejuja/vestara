import { useEffect, useRef, useState, useCallback } from 'react';
import { io } from 'socket.io-client';
import toast from 'react-hot-toast';

const SOCKET_URL = import.meta.env.PROD ? '/' : 'http://localhost:3001';

export function useSocket() {
  const socketRef = useRef(null);
  const [livePnL, setLivePnL] = useState(null);
  const [connected, setConnected] = useState(false);

  const connect = useCallback(() => {
    const token = localStorage.getItem('token');
    if (!token) return;

    // Disconnect previous socket if any
    if (socketRef.current) {
      socketRef.current.disconnect();
    }

    const socket = io(SOCKET_URL, {
      auth: { token },
      transports: ['websocket', 'polling'],
    });

    socket.on('connect', () => {
      setConnected(true);
      console.log('🔌 Socket connected');
    });

    socket.on('disconnect', () => {
      setConnected(false);
      console.log('🔌 Socket disconnected');
    });

    socket.on('pnl_update', (data) => {
      setLivePnL(data);
    });

    socket.on('alert_triggered', (data) => {
      toast(data.message || 'Alert triggered!', {
        icon: '🔔',
        duration: 6000,
        style: {
          background: 'rgba(15, 23, 42, 0.95)',
          color: '#f1f5f9',
          border: '1px solid rgba(245, 158, 11, 0.3)',
          backdropFilter: 'blur(16px)',
        },
      });
    });

    socket.on('connect_error', (err) => {
      console.error('Socket connection error:', err.message);
    });

    socketRef.current = socket;
  }, []);

  const disconnect = useCallback(() => {
    if (socketRef.current) {
      socketRef.current.disconnect();
      socketRef.current = null;
      setConnected(false);
      setLivePnL(null);
    }
  }, []);

  useEffect(() => {
    connect();
    return () => disconnect();
  }, [connect, disconnect]);

  return { livePnL, connected, reconnect: connect, disconnect };
}

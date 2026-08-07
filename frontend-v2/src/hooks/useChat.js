import { useState, useEffect, useRef, useCallback } from "react";
import { messages as messagesApi, connectChat } from "../services/api";

export function useChat(groupId) {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const wsRef = useRef(null);

  // Load history on group change
  useEffect(() => {
    if (!groupId) return;

    setLoading(true);
    messagesApi
      .history(groupId)
      .then(setMessages)
      .catch(console.error)
      .finally(() => setLoading(false));

    // Connect WebSocket
    const ws = connectChat(groupId, (msg) => {
      setMessages((prev) => [...prev, msg]);
    });
    wsRef.current = ws;

    return () => ws.close();
  }, [groupId]);

  const sendMessage = useCallback(
    (content) => {
      if (wsRef.current && content.trim()) {
        wsRef.current.send(content);
      }
    },
    []
  );

  return { messages, loading, sendMessage };
}

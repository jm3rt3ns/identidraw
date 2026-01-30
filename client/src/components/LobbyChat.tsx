import { useEffect, useRef, useState } from 'react';
import { useSocket } from '../contexts/SocketContext';
import type { ChatMessage } from '../types';

interface Props {
  lobbyCode: string;
}

export default function LobbyChat({ lobbyCode }: Props) {
  const { socket } = useSocket();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!socket) return;

    const onMessage = (msg: ChatMessage) => {
      setMessages((prev) => [...prev, msg]);
    };

    socket.on('lobby:chatMessage', onMessage);
    return () => {
      socket.off('lobby:chatMessage', onMessage);
    };
  }, [socket]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!socket || !input.trim()) return;

    socket.emit('lobby:chat', { code: lobbyCode, message: input.trim() });
    setInput('');
  };

  return (
    <>
      <h3 className="text-sm font-medium text-slate-400 mb-2">Chat</h3>
      <div className="flex-1 overflow-y-auto space-y-1 text-sm mb-2">
        {messages.length === 0 && (
          <p className="text-slate-500 text-center py-4">
            No messages yet. Say hello!
          </p>
        )}
        {messages.map((msg, i) => (
          <div key={i} className="px-2 py-1">
            <span className="font-medium text-brand-500">{msg.username}: </span>
            <span className="text-slate-300">{msg.message}</span>
          </div>
        ))}
        <div ref={chatEndRef} />
      </div>
      <form onSubmit={handleSend} className="flex gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Type a message..."
          className="input flex-1"
        />
        <button
          type="submit"
          disabled={!input.trim()}
          className="btn-primary shrink-0"
        >
          Send
        </button>
      </form>
    </>
  );
}

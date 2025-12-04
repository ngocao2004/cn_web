// my-react-app/src/pages/AIChatPage.jsx
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AIChat from '../components/AIChat';
import FallingStarCanvas from '../components/FallingStarCanvas';

export default function AIChatPage() {
  const navigate = useNavigate();
  const [showChat, setShowChat] = useState(true);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      <FallingStarCanvas />
      {showChat && (
        <AIChat onClose={() => navigate(-1)} />
      )}
    </div>
  );
}
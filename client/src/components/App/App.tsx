import KnowledgeBase from '../../pages/KnowledgeBase/KnowledgeBase';
import { Route, Routes } from 'react-router-dom';
import Intro from '../../pages/Intro/Intro';
import Chat from '../../pages/Chat/Chat';
import AppLayout from '../AppLayout/AppLayout';
import './App.css';

export default function App() {
  return (
    <div className="app">
      <Routes>
        <Route path="/" element={<Intro />} />
        <Route element={<AppLayout />}>
          <Route path="/knowledge" element={<KnowledgeBase />} />
          <Route path="/chat" element={<Chat />} />
        </Route>
      </Routes>
    </div>
  );
}

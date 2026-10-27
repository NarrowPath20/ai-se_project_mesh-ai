import KnowledgeBase from '../../pages/KnowledgeBase/KnowledgeBase';
import { Route, Routes } from 'react-router-dom';
import Intro from '../../pages/Intro/Intro';
import Chat from '../../pages/Chat/Chat';
import AppLayout from '../AppLayout/AppLayout';
import Login from '../../pages/Login/Login';
import Register from '../../pages/Register/Register';
import { ProtectedRoute, PublicRoute } from '../ProtectedRoute/ProtectedRoute';
import './App.css';

export default function App() {
  return (
    <div className="app">
      <Routes>
        <Route path="/" element={<Intro />} />
        <Route element={<PublicRoute />}>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
        </Route>
        <Route element={<AppLayout />}>
          <Route element={<ProtectedRoute />}>
            <Route path="/knowledge" element={<KnowledgeBase />} />
            <Route path="/chat" element={<Chat />} />
          </Route>
        </Route>
      </Routes>
    </div>
  );
}

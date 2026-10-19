import './Intro.css';
import { useNavigate } from 'react-router-dom';

const features = [
  { icon: 'documents', title: 'Build your knowledge base', description: 'Upload your documents and keep your knowledge in one place.' },
  { icon: 'messages', title: 'Ask questions', description: 'Chat with AI to find answers in your documents.' },
  { icon: 'spark', title: 'Connect the dots', description: 'Turn your knowledge into insights and ideas.' },
];

export default function Intro() {
  const navigate = useNavigate();

  return (
    <main className="intro">
      <p className="intro__brand">MeshAI</p>
      <h1 className="intro__heading">Welcome to MeshAI</h1>
      <p className="intro__description">Your knowledge. Connected.</p>
      <ul className="intro__features">
        {features.map(({ icon, title, description }) => (
          <li className="intro__card" key={icon}>
            <span className={`intro__icon intro__icon_${icon}`} aria-hidden="true">
              {icon === 'documents' ? '▤' : icon === 'messages' ? '◌' : '✦'}
            </span>
            <h2 className="intro__card-title">{title}</h2>
            <p className="intro__card-description">{description}</p>
          </li>
        ))}
      </ul>
      <button className="intro__start" type="button" onClick={() => navigate('/knowledge')}>Start</button>
    </main>
  );
}

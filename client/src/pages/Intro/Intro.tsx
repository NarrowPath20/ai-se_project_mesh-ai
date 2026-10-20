import { useNavigate } from 'react-router-dom';
import documents from '../../assets/intro-documents.png';
import organize from '../../assets/intro-organize.png';
import chat from '../../assets/intro-chat.png';
import documentsMobile from '../../assets/intro-documents-mobile.png';
import organizeMobile from '../../assets/intro-organize-mobile.png';
import chatMobile from '../../assets/intro-chat-mobile.png';
import './Intro.css';

const features = [
  { image: documents, mobileImage: documentsMobile, description: 'Bring all your documents into one secure AI workspace' },
  { image: organize, mobileImage: organizeMobile, description: 'Organize and manage the documents that power your AI' },
  { image: chat, mobileImage: chatMobile, description: 'Your knowledge base, accessible through a simple chat interface' },
];

export default function Intro() {
  const navigate = useNavigate();
  return (
    <main className="intro">
      <h1 className="intro__heading">Welcome <span>to Mesh AI</span><span className="intro__mark" aria-hidden="true"><i /><i /><i /><i /><i /><i /></span></h1>
      <ul className="intro__features">
        {features.map(({ image, mobileImage, description }) => (
          <li className="intro__card" key={description}>
            <picture className="intro__icon">
              <source media="(width < 700px)" srcSet={mobileImage} />
              <img src={image} alt="" />
            </picture>
            <p className="intro__card-description">{image === documents ? <>Bring all your documents <br className="intro__desktop-break" />into one secure <br className="intro__desktop-break" />AI workspace</> : description}</p>
          </li>
        ))}
      </ul>
      <div className="intro__footer">
        <p className="intro__instruction">Start by creating your Organization’s Knowledge Base</p>
        <button className="intro__start" type="button" onClick={() => navigate('/knowledge')}>Start</button>
      </div>
    </main>
  );
}

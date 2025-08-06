import React from 'react';
import Image from 'next/image';
import { WhatsAppMessage } from './types';

interface MessageBubbleProps {
  message: WhatsAppMessage;
}

const MessageBubble: React.FC<MessageBubbleProps> = ({ message }) => {
  const isFromContact = message.sent_by === 'contact';
  const isFromIA = message.sent_by === 'ia';
  const isFromMedico = message.sent_by === 'medico';

  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString('pt-BR', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getBubbleStyles = () => {
    if (isFromContact) {
      return {
        container: 'flex justify-start mb-4',
        bubble: 'bg-gray-100 text-gray-900 rounded-lg rounded-bl-sm',
        tail: 'border-gray-100'
      };
    } else if (isFromIA) {
      return {
        container: 'flex justify-end mb-4',
        bubble: 'bg-blue-500 text-white rounded-lg rounded-br-sm',
        tail: 'border-blue-500'
      };
    } else {
      return {
        container: 'flex justify-end mb-4',
        bubble: 'bg-green-500 text-white rounded-lg rounded-br-sm',
        tail: 'border-green-500'
      };
    }
  };

  const getSenderLabel = () => {
    if (isFromContact) return 'Paciente';
    if (isFromIA) return 'IA';
    return 'Você';
  };

  const getSenderIcon = () => {
    if (isFromContact) {
      return (
        <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center mr-2 flex-shrink-0">
          <svg className="w-4 h-4 text-gray-600" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
          </svg>
        </div>
      );
    } else if (isFromIA) {
      return (
        <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center ml-2 flex-shrink-0">
          <svg className="w-4 h-4 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
            <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
      );
    } else {
      return (
        <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center ml-2 flex-shrink-0">
          <svg className="w-4 h-4 text-green-600" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
          </svg>
        </div>
      );
    }
  };

  const styles = getBubbleStyles();

  return (
    <div className={styles.container}>
      <div className={`flex max-w-xs lg:max-w-md ${isFromContact ? 'flex-row' : 'flex-row-reverse'}`}>
        {getSenderIcon()}
        
        <div className={`px-4 py-2 ${styles.bubble} shadow-md relative`}>
          {/* Sender label */}
          <div className={`text-xs font-medium mb-1 ${
            isFromContact ? 'text-gray-500' : 'text-white opacity-75'
          }`}>
            {getSenderLabel()}
          </div>
          
          {/* Message content */}
          <div className="text-sm leading-relaxed whitespace-pre-wrap">
            {message.message_content}
          </div>
          
          {/* Media content */}
          {message.media_url && (
            <div className="mt-2">
              {message.message_type === 'image' && (
                <Image 
                  src={message.media_url} 
                  alt="Mídia compartilhada"
                  className="max-w-full h-auto rounded-md"
                  width={300}
                  height={200}
                  style={{ objectFit: 'contain' }}
                />
              )}
              {message.message_type === 'audio' && (
                <audio controls className="w-full">
                  <source src={message.media_url} type="audio/mpeg" />
                  Seu navegador não suporta áudio.
                </audio>
              )}
              {message.message_type === 'video' && (
                <video controls className="max-w-full h-auto rounded-md">
                  <source src={message.media_url} type="video/mp4" />
                  Seu navegador não suporta vídeo.
                </video>
              )}
              {message.message_type === 'document' && (
                <a 
                  href={message.media_url} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="inline-flex items-center space-x-2 text-blue-600 hover:text-blue-800"
                >
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd" />
                  </svg>
                  <span>Abrir documento</span>
                </a>
              )}
            </div>
          )}
          
          {/* Timestamp */}
          <div className={`text-xs mt-1 ${
            isFromContact ? 'text-gray-400' : 'text-white opacity-50'
          }`}>
            {formatTime(message.sent_at)}
          </div>
          
          {/* Status indicators for sent messages */}
          {!isFromContact && (
            <div className="absolute bottom-1 right-1">
              <svg className={`w-3 h-3 ${
                isFromIA ? 'text-white opacity-75' : 'text-white opacity-75'
              }`} fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MessageBubble; 
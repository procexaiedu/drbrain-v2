'use client';

import React, { useState } from 'react';
import { useApp } from '@/context/AppContext';
import { ChatBubbleLeftRightIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { ChatBubbleLeftRightIcon as ChatBubbleLeftRightIconSolid } from '@heroicons/react/24/solid';

export default function FeedbackButton() {
  const { openFeedbackModal } = useApp();
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div className="fixed bottom-6 right-6 z-40">
      <button
        onClick={openFeedbackModal}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        className="group relative bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white p-4 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-110 focus:outline-none focus:ring-4 focus:ring-indigo-500/30"
        title="Enviar Feedback"
      >
        {/* Ícone principal */}
        <div className="relative">
          {isHovered ? (
            <ChatBubbleLeftRightIconSolid className="h-6 w-6 transition-all duration-200" />
          ) : (
            <ChatBubbleLeftRightIcon className="h-6 w-6 transition-all duration-200" />
          )}
          
          {/* Indicador de pulso */}
          <div className="absolute -top-1 -right-1 h-3 w-3 bg-green-400 rounded-full animate-pulse"></div>
        </div>

        {/* Tooltip expandido */}
        <div className={`absolute right-full mr-3 top-1/2 transform -translate-y-1/2 bg-gray-900 text-white text-sm px-3 py-2 rounded-lg whitespace-nowrap transition-all duration-200 ${isHovered ? 'opacity-100 scale-100' : 'opacity-0 scale-95'} pointer-events-none`}>
          💬 Enviar Feedback
          <div className="absolute left-full top-1/2 transform -translate-y-1/2 border-4 border-transparent border-l-gray-900"></div>
        </div>

        {/* Efeito de ondas no background */}
        <div className="absolute inset-0 rounded-full bg-gradient-to-r from-indigo-600 to-purple-600 animate-pulse opacity-20"></div>
        
        {/* Efeito de brilho no hover */}
        <div className="absolute inset-0 rounded-full bg-gradient-to-r from-transparent via-white/20 to-transparent transform scale-x-0 group-hover:scale-x-100 transition-transform duration-500"></div>
      </button>
    </div>
  );
} 
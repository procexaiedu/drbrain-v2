import React, { useState, useRef, useEffect } from 'react';
import { 
  MicrophoneIcon, 
  StopIcon, 
  PlayIcon, 
  PauseIcon,
  ComputerDesktopIcon,
  TrashIcon
} from '@heroicons/react/24/outline';

interface AudioRecorderProps {
  onAudioReady: (audioBlob: Blob, filename: string) => void;
  mode: 'microphone' | 'screen_and_mic';
  disabled?: boolean;
}

type RecordingState = 'idle' | 'recording' | 'paused' | 'ready';

const AudioRecorder: React.FC<AudioRecorderProps> = ({ 
  onAudioReady, 
  mode, 
  disabled = false 
}) => {
  const [recordingState, setRecordingState] = useState<RecordingState>('idle');
  const [recordingTime, setRecordingTime] = useState(0);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [audioLevel, setAudioLevel] = useState(0);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animationFrameRef = useRef<number | undefined>(undefined);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | undefined>(undefined);
  const audioElementRef = useRef<HTMLAudioElement>(null);

  // Cleanup ao desmontar
  useEffect(() => {
    return () => {
      stopRecording();
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      if (audioUrl) {
        URL.revokeObjectURL(audioUrl);
      }
    };
  }, []);

  // Monitorar nível do áudio
  const updateAudioLevel = () => {
    if (!analyserRef.current) return;
    
    const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
    analyserRef.current.getByteFrequencyData(dataArray);
    
    const average = dataArray.reduce((sum, value) => sum + value, 0) / dataArray.length;
    setAudioLevel(Math.min(average / 128, 1));
    
    if (recordingState === 'recording') {
      animationFrameRef.current = requestAnimationFrame(updateAudioLevel);
    }
  };

  const startRecording = async () => {
    try {
      audioChunksRef.current = [];
      setRecordingTime(0);
      setAudioLevel(0);
      
      let stream: MediaStream;
      
      if (mode === 'microphone') {
        // Apenas microfone
        stream = await navigator.mediaDevices.getUserMedia({ 
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true
          } 
        });
      } else {
        // Tela + microfone
        try {
          // Primeiro obter o áudio da tela com vídeo (necessário para seleção da aba)
          const displayStream = await navigator.mediaDevices.getDisplayMedia({ 
            audio: true,
            video: true 
          });
          
          // Depois obter o áudio do microfone
          const micStream = await navigator.mediaDevices.getUserMedia({ 
            audio: {
              echoCancellation: true,
              noiseSuppression: true,
              autoGainControl: true
            } 
          });
          
          // Criar AudioContext para mixar os streams
          const audioContext = new AudioContext();
          audioContextRef.current = audioContext;
          
          const displaySource = audioContext.createMediaStreamSource(displayStream);
          const micSource = audioContext.createMediaStreamSource(micStream);
          const destination = audioContext.createMediaStreamDestination();
          
          // Conectar ambas as fontes ao destino
          displaySource.connect(destination);
          micSource.connect(destination);
          
          // Usar o stream mixado (apenas áudio)
          stream = destination.stream;
          
          // Parar a track de vídeo para economizar recursos (só precisamos do áudio)
          const videoTracks = displayStream.getVideoTracks();
          videoTracks.forEach(track => track.stop());
          
          // Configurar analisador para o microfone (feedback visual)
          const analyser = audioContext.createAnalyser();
          analyser.fftSize = 256;
          micSource.connect(analyser);
          analyserRef.current = analyser;
          
        } catch (error) {
          console.warn('Erro ao capturar tela + microfone, usando apenas microfone:', error);
          // Fallback para apenas microfone
          stream = await navigator.mediaDevices.getUserMedia({ 
            audio: {
              echoCancellation: true,
              noiseSuppression: true,
              autoGainControl: true
            } 
          });
        }
      }
      
      // Configurar analisador se ainda não foi configurado
      if (!analyserRef.current) {
        const audioContext = new AudioContext();
        audioContextRef.current = audioContext;
        const source = audioContext.createMediaStreamSource(stream);
        const analyser = audioContext.createAnalyser();
        analyser.fftSize = 256;
        source.connect(analyser);
        analyserRef.current = analyser;
      }
      
      // Configurar MediaRecorder
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm;codecs=opus'
      });
      
      mediaRecorderRef.current = mediaRecorder;
      
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };
      
      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const url = URL.createObjectURL(audioBlob);
        setAudioUrl(url);
        setRecordingState('ready');
        
        // Parar streams
        stream.getTracks().forEach(track => track.stop());
      };
      
      mediaRecorder.start();
      setRecordingState('recording');
      
      // Iniciar timer
      timerRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);
      
      // Iniciar monitoramento do nível de áudio
      updateAudioLevel();
      
    } catch (error) {
      console.error('Erro ao iniciar gravação:', error);
      alert('Erro ao acessar microfone/tela. Verifique as permissões.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && recordingState === 'recording') {
      mediaRecorderRef.current.stop();
      clearInterval(timerRef.current);
      setAudioLevel(0);
      
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      
      if (audioContextRef.current) {
        audioContextRef.current.close();
        audioContextRef.current = null;
      }
    }
  };

  const playAudio = () => {
    if (audioElementRef.current && audioUrl) {
      if (isPlaying) {
        audioElementRef.current.pause();
      } else {
        audioElementRef.current.play();
      }
    }
  };

  const resetRecording = () => {
    if (audioUrl) {
      URL.revokeObjectURL(audioUrl);
      setAudioUrl(null);
    }
    setRecordingState('idle');
    setRecordingTime(0);
    setAudioLevel(0);
    audioChunksRef.current = [];
  };

  const confirmAudio = () => {
    if (audioUrl && audioChunksRef.current.length > 0) {
      const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const filename = mode === 'microphone' 
        ? `gravacao_presencial_${timestamp}.webm`
        : `gravacao_telemedicina_${timestamp}.webm`;
      
      onAudioReady(audioBlob, filename);
    }
  };

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="space-y-4">
      {/* Controles principais */}
      <div className="flex items-center justify-center space-x-4">
        {recordingState === 'idle' && (
          <button
            onClick={startRecording}
            disabled={disabled}
            className={`flex items-center space-x-2 px-6 py-3 rounded-lg text-white font-semibold ${
              disabled 
                ? 'bg-gray-400 cursor-not-allowed' 
                : 'bg-red-600 hover:bg-red-700'
            }`}
          >
            {mode === 'microphone' ? (
              <MicrophoneIcon className="h-5 w-5" />
            ) : (
              <ComputerDesktopIcon className="h-5 w-5" />
            )}
            <span>
              {mode === 'microphone' 
                ? 'Iniciar Gravação do Microfone' 
                : 'Iniciar Gravação da Tela e Microfone'
              }
            </span>
          </button>
        )}

        {recordingState === 'recording' && (
          <button
            onClick={stopRecording}
            className="flex items-center space-x-2 px-6 py-3 rounded-lg bg-gray-600 hover:bg-gray-700 text-white font-semibold"
          >
            <StopIcon className="h-5 w-5" />
            <span>Parar Gravação</span>
          </button>
        )}

        {recordingState === 'ready' && (
          <div className="flex items-center space-x-3">
            <button
              onClick={playAudio}
              className="flex items-center space-x-2 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white"
            >
              {isPlaying ? (
                <PauseIcon className="h-4 w-4" />
              ) : (
                <PlayIcon className="h-4 w-4" />
              )}
              <span>{isPlaying ? 'Pausar' : 'Reproduzir'}</span>
            </button>
            
            <button
              onClick={resetRecording}
              className="flex items-center space-x-2 px-4 py-2 rounded-lg bg-gray-600 hover:bg-gray-700 text-white"
            >
              <TrashIcon className="h-4 w-4" />
              <span>Descartar</span>
            </button>
            
            <button
              onClick={confirmAudio}
              className="flex items-center space-x-2 px-6 py-2 rounded-lg bg-green-600 hover:bg-green-700 text-white font-semibold"
            >
              <span>Usar este áudio</span>
            </button>
          </div>
        )}
      </div>

      {/* Timer e medidor de áudio */}
      {(recordingState === 'recording' || recordingState === 'ready') && (
        <div className="text-center space-y-3">
          <div className="text-2xl font-mono text-gray-700">
            {formatTime(recordingTime)}
          </div>
          
          {recordingState === 'recording' && (
            <div className="flex items-center justify-center space-x-2">
              <span className="text-sm text-gray-500">Nível do áudio:</span>
              <div className="w-32 h-2 bg-gray-200 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-green-400 to-red-500 transition-all duration-75"
                  style={{ width: `${audioLevel * 100}%` }}
                />
              </div>
            </div>
          )}
        </div>
      )}

      {/* Elemento de áudio oculto para reprodução */}
      {audioUrl && (
        <audio
          ref={audioElementRef}
          src={audioUrl}
          onPlay={() => setIsPlaying(true)}
          onPause={() => setIsPlaying(false)}
          onEnded={() => setIsPlaying(false)}
          className="hidden"
        />
      )}
    </div>
  );
};

export default AudioRecorder; 
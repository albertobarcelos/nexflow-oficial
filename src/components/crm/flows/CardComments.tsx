import { useState, useRef, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { MentionInput } from './MentionInput';
import { useCardMessages, useSendMessage, useDeleteMessage } from '@/hooks/useCardMessages';
import { useNexflowUsers } from '@/hooks/useNexflowUsers';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { 
  Send, 
  Mic, 
  File as FileIcon, 
  Trash2,
  Download,
  X,
  Square,
  Play,
  Pause
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { useAudioRecorder } from 'react-audio-voice-recorder';

interface CardCommentsProps {
  cardId: string;
}

// Componente de player de áudio customizado
function AudioPlayer({ url, fileName }: { url: string; fileName: string }) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const updateTime = () => setCurrentTime(audio.currentTime);
    const updateDuration = () => {
      setDuration(audio.duration);
      setIsLoading(false);
    };
    const handlePlay = () => setIsPlaying(true);
    const handlePause = () => setIsPlaying(false);
    const handleEnded = () => setIsPlaying(false);

    audio.addEventListener('timeupdate', updateTime);
    audio.addEventListener('loadedmetadata', updateDuration);
    audio.addEventListener('play', handlePlay);
    audio.addEventListener('pause', handlePause);
    audio.addEventListener('ended', handleEnded);

    return () => {
      audio.removeEventListener('timeupdate', updateTime);
      audio.removeEventListener('loadedmetadata', updateDuration);
      audio.removeEventListener('play', handlePlay);
      audio.removeEventListener('pause', handlePause);
      audio.removeEventListener('ended', handleEnded);
    };
  }, []);

  const togglePlayPause = () => {
    const audio = audioRef.current;
    if (!audio) return;

    if (isPlaying) {
      audio.pause();
    } else {
      audio.play();
    }
  };

  const formatTime = (seconds: number) => {
    if (isNaN(seconds)) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div className="flex items-center justify-center gap-1.5 px-4 py-3 m-1.5 text-left bg-white  rounded-lg border border-gray-200  min-w-[280px] max-w-xs">
      <audio ref={audioRef} src={url} preload="metadata" />
      
      <Button
        variant="ghost"
        size="icon"
        className="h-10 w-10 flex-shrink-0 rounded-full bg-blue-600 hover:bg-blue-700 text-white"
        onClick={togglePlayPause}
        disabled={isLoading}
        title={isPlaying ? 'Pausar' : 'Reproduzir'}
      >
        {isPlaying ? (
          <Pause className="h-5 w-5" />
        ) : (
          <Play className="h-5 w-5 ml-0.5" />
        )}
      </Button>

      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-1">
          <span className="text-xs font-medium text-gray-700  truncate">
            {fileName}
          </span>
          <span className="text-xs text-gray-500  flex-shrink-0 ml-2">
            {formatTime(currentTime)} / {formatTime(duration)}
          </span>
        </div>
        
        <div className="relative h-1.5 bg-gray-200  rounded-full overflow-hidden">
          <div
            className="absolute top-0 left-0 h-full bg-blue-600 transition-all duration-100"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>
    </div>
  );
}

export function CardComments({ cardId }: CardCommentsProps) {
  const [message, setMessage] = useState('');
  const [mentions, setMentions] = useState<string[]>([]);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  
  // Usar hook do react-audio-voice-recorder
  const {
    startRecording,
    stopRecording: stopRecordingHook,
    togglePauseResume,
    recordingBlob,
    isRecording,
    isPaused,
    recordingTime,
    mediaRecorder
  } = useAudioRecorder(
    {
      noiseSuppression: true,
      echoCancellation: true,
    } as MediaTrackConstraints,
    (err) => {
      console.error('Erro ao acessar microfone:', err);
      toast.error('Erro ao acessar o microfone. Verifique as permissões.');
    }
  );

  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);
  const audioButtonRef = useRef<HTMLButtonElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const savedRecordingBlobRef = useRef<Blob | null>(null);

  const { data: messages = [], isLoading } = useCardMessages(cardId);
  const sendMessage = useSendMessage();
  const deleteMessage = useDeleteMessage();
  const { data: users = [] } = useNexflowUsers();
  const { user } = useAuth();
  
  // Obter user_id do usuário autenticado
  const currentUserId = user?.id;

  // Scroll para o final quando novas mensagens chegarem
  useEffect(() => {
    if (scrollAreaRef.current) {
      const scrollContainer = scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]');
      if (scrollContainer) {
        scrollContainer.scrollTop = scrollContainer.scrollHeight;
      }
    }
  }, [messages]);

  // Função para desenhar waveform (linha simples que se move)
  const drawSpectrogram = useCallback(() => {
    if (!analyserRef.current || !canvasRef.current || !isRecording) {
      return;
    }
    
    const analyser = analyserRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    // Inicializar canvas se necessário
    if (canvas.width === 0 || canvas.height === 0) {
      const rect = canvas.getBoundingClientRect();
      if (rect.width > 0) {
        const dpr = window.devicePixelRatio || 1;
        canvas.width = rect.width * dpr;
        canvas.height = 120 * dpr;
        ctx.scale(dpr, dpr);
        canvas.style.width = `${rect.width}px`;
        canvas.style.height = '120px';
      }
    }
    
    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    
    const draw = () => {
      if (!isRecording || !analyserRef.current || !canvasRef.current) {
        if (animationFrameRef.current) {
          cancelAnimationFrame(animationFrameRef.current);
          animationFrameRef.current = null;
        }
        return;
      }
      
      const currentAnalyser = analyserRef.current;
      const currentCanvas = canvasRef.current;
      const currentCtx = currentCanvas.getContext('2d');
      
      if (!currentCtx) return;
      
      animationFrameRef.current = requestAnimationFrame(draw);
      
      // Usar getByteTimeDomainData para waveform (linha que se move)
      currentAnalyser.getByteTimeDomainData(dataArray);
      
      // Limpar canvas com fundo slate-900 (tema claro)
      currentCtx.fillStyle = 'rgb(15, 23, 42)';
      currentCtx.fillRect(0, 0, currentCanvas.width, currentCanvas.height);
      
      const dpr = window.devicePixelRatio || 1;
      const visualHeight = 120;
      const visualWidth = currentCanvas.width / dpr;
      const centerY = visualHeight / 2;
      
      // Desenhar linha de referência central sutil
      currentCtx.strokeStyle = 'rgba(71, 85, 105, 0.3)';
      currentCtx.lineWidth = 1;
      currentCtx.setLineDash([5, 5]);
      currentCtx.beginPath();
      currentCtx.moveTo(0, centerY);
      currentCtx.lineTo(visualWidth, centerY);
      currentCtx.stroke();
      currentCtx.setLineDash([]);
      
      // Criar gradiente para a waveform (indigo-500/400)
      const gradient = currentCtx.createLinearGradient(0, 0, visualWidth, 0);
      gradient.addColorStop(0, 'rgb(99, 102, 241)');
      gradient.addColorStop(0.5, 'rgb(129, 140, 248)');
      gradient.addColorStop(1, 'rgb(99, 102, 241)');
      
      // Desenhar linha da waveform com cor primary do projeto e gradiente
      currentCtx.lineWidth = 2.5;
      currentCtx.strokeStyle = gradient;
      currentCtx.shadowBlur = 10;
      currentCtx.shadowColor = 'rgba(99, 102, 241, 0.5)';
      currentCtx.lineCap = 'round';
      currentCtx.lineJoin = 'round';
      currentCtx.beginPath();
      
      const sliceWidth = visualWidth / bufferLength;
      let x = 0;
      
      for (let i = 0; i < bufferLength; i++) {
        // Converter valor de 0-255 para -1 a 1 (128 é o centro)
        const v = (dataArray[i] - 128) / 128.0;
        const y = v * centerY * 0.8; // Reduzir amplitude para visual mais suave
        
        if (i === 0) {
          currentCtx.moveTo(x, centerY + y);
        } else {
          currentCtx.lineTo(x, centerY + y);
        }
        
        x += sliceWidth;
      }
      
      currentCtx.stroke();
      
      // Reset shadow e line properties
      currentCtx.shadowBlur = 0;
      currentCtx.lineCap = 'butt';
      currentCtx.lineJoin = 'miter';
    };
    
    draw();
  }, [isRecording]);

  // Criar arquivo quando recordingBlob estiver disponível
  useEffect(() => {
    if (recordingBlob && recordingBlob.size > 0) {
      // Salvar o blob em uma ref para manter mesmo se o hook limpar
      savedRecordingBlobRef.current = recordingBlob;
      
      // Verificar se já não temos este arquivo com o mesmo tamanho (evitar recriar)
      if (selectedFile && selectedFile.size === recordingBlob.size) {
        console.log('Arquivo já existe, mantendo:', selectedFile.name);
        return;
      }

      // Criar arquivo diretamente do blob
      // O File mantém uma referência ao blob, então não será perdido mesmo se recordingBlob for limpo
      const audioFile = new File([recordingBlob], `audio-${Date.now()}.webm`, {
        type: recordingBlob.type || 'audio/webm',
      });
      
      // Armazenar no cache
      const audioUrl = URL.createObjectURL(recordingBlob);
      try {
        if ('indexedDB' in window) {
          const cacheKey = `audio_cache_${Date.now()}`;
          localStorage.setItem(cacheKey, audioUrl);
          (window as any).__audioCache = audioFile;
        }
      } catch (e) {
        console.warn('Não foi possível armazenar áudio no cache:', e);
      }
      
      // Definir o arquivo - isso deve persistir mesmo se recordingBlob for limpo
      setSelectedFile(audioFile);
      const duration = recordingTime;
      console.log('✅ Arquivo de áudio criado e salvo:', audioFile.name, 'Tamanho:', audioFile.size, 'bytes');
      toast.success(`Áudio gravado (${Math.floor(duration / 60)}:${(duration % 60).toString().padStart(2, '0')})! Clique em enviar para compartilhar.`);
    }
  }, [recordingBlob]);

  // Configurar espectrograma quando gravação iniciar
  useEffect(() => {
    if (isRecording && mediaRecorder) {
      // Aguardar um pouco para garantir que o stream esteja disponível
      const setupSpectrogram = () => {
        try {
          // Verificar se o stream está disponível
          const stream = mediaRecorder.stream;
          if (!stream || stream.getTracks().length === 0) {
            // Tentar novamente após um delay
            setTimeout(setupSpectrogram, 100);
            return;
          }

          // Limpar AudioContext anterior se existir
          if (audioContextRef.current) {
            try {
              if (audioContextRef.current.state !== 'closed') {
                audioContextRef.current.close().catch(() => {});
              }
            } catch (e) {
              // Ignorar erros
            }
            audioContextRef.current = null;
          }

          // Configurar Web Audio API para espectrograma
          const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
          const analyser = audioContext.createAnalyser();
          analyser.fftSize = 256;
          const source = audioContext.createMediaStreamSource(stream);
          source.connect(analyser);
          
          audioContextRef.current = audioContext;
          analyserRef.current = analyser;
          
          // Iniciar visualização após um pequeno delay
          setTimeout(() => {
            drawSpectrogram();
          }, 50);
        } catch (error) {
          console.warn('Erro ao configurar espectrograma:', error);
        }
      };

      setupSpectrogram();
      
      return () => {
        // Cleanup
        if (animationFrameRef.current) {
          cancelAnimationFrame(animationFrameRef.current);
          animationFrameRef.current = null;
        }
        if (audioContextRef.current) {
          try {
            if (audioContextRef.current.state !== 'closed') {
              audioContextRef.current.close().catch((error) => {
                // Ignorar erros se já estiver fechado
                if (error?.name !== 'InvalidStateError') {
                  console.warn('Erro ao fechar AudioContext:', error);
                }
              });
            }
          } catch (error) {
            // Ignorar erros se já estiver fechado
            if ((error as Error)?.name !== 'InvalidStateError') {
              console.warn('Erro ao verificar estado do AudioContext:', error);
            }
          } finally {
            audioContextRef.current = null;
          }
        }
        analyserRef.current = null;
      };
    } else {
      // Limpar quando parar de gravar
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
      if (canvasRef.current) {
        const ctx = canvasRef.current.getContext('2d');
        if (ctx) {
          ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
        }
      }
      // Limpar AudioContext se ainda existir
      if (audioContextRef.current) {
        try {
          if (audioContextRef.current.state !== 'closed') {
            audioContextRef.current.close().catch(() => {});
          }
        } catch (e) {
          // Ignorar erros
        }
        audioContextRef.current = null;
      }
    }
  }, [isRecording, mediaRecorder, drawSpectrogram]);

  const handleSend = async () => {
    if (!message.trim() && !selectedFile) {
      toast.error('Digite uma mensagem ou selecione um arquivo');
      return;
    }

    // Não permitir enviar enquanto está gravando
    if (isRecording) {
      toast.info('Finalize a gravação antes de enviar');
      return;
    }

    try {
      // Verificar se o arquivo existe e é válido
      if (selectedFile) {
        console.log('Enviando arquivo:', {
          name: selectedFile.name,
          type: selectedFile.type,
          size: selectedFile.size,
        });
        
        if (selectedFile.size === 0) {
          toast.error('O arquivo está vazio. Por favor, grave novamente.');
          return;
        }
      }

      await sendMessage.mutateAsync({
        card_id: cardId,
        content: message.trim() || undefined,
        message_type: selectedFile
          ? selectedFile.type.startsWith('audio/')
            ? 'audio'
            : selectedFile.type.startsWith('video/')
            ? 'video'
            : 'file'
          : 'text',
        file: selectedFile || undefined,
        mentions: mentions.length > 0 ? mentions : undefined,
      });

      setMessage('');
      setMentions([]);
      setSelectedFile(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
      if (videoInputRef.current) videoInputRef.current.value = '';
      
      toast.success('Mensagem enviada com sucesso!');
    } catch (error: any) {
      // Mensagem de erro mais específica
      const errorMessage = error?.message || 'Erro ao enviar mensagem';
      if (errorMessage.includes('Bucket') && errorMessage.includes('não encontrado')) {
        toast.error('Bucket do Supabase não configurado. Por favor, crie o bucket "card-messages" no dashboard do Supabase.');
      } else {
        toast.error(errorMessage);
      }
      console.error('Erro ao enviar:', error);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 100 * 1024 * 1024) {
        toast.error('Arquivo muito grande. Tamanho máximo: 100MB');
        return;
      }
      setSelectedFile(file);
    }
  };

  // Função para parar gravação usando o hook
  const stopRecording = () => {
    if (isRecording) {
      // O hook vai criar o recordingBlob quando parar
      // O useEffect vai capturar e criar o arquivo
      stopRecordingHook();
    }
  };

  // Função para cancelar gravação
  const cancelRecording = () => {
    if (isRecording) {
      stopRecordingHook();
      setSelectedFile(null);
      savedRecordingBlobRef.current = null; // Limpar blob salvo ao cancelar
      toast.info('Gravação cancelada');
    }
  };

  // Handler para botão de áudio
  const handleAudioButtonClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!isRecording) {
      // Iniciar gravação
      startRecording();
    } else {
      // Parar gravação
      stopRecording();
    }
  };

  // Cleanup: O hook useAudioRecorder gerencia o cleanup automaticamente

  const handleDelete = async (messageId: string) => {
    if (!confirm('Tem certeza que deseja deletar esta mensagem?')) return;

    try {
      await deleteMessage.mutateAsync({ messageId, cardId });
      toast.success('Mensagem deletada');
    } catch (error) {
      toast.error('Erro ao deletar mensagem');
    }
  };

  const getUserById = (userId: string) => {
    return users.find((u) => u.id === userId);
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const isImage = (fileType: string | null) => {
    return fileType?.startsWith('image/');
  };

  const isVideo = (fileType: string | null) => {
    return fileType?.startsWith('video/');
  };

  const isAudio = (fileType: string | null) => {
    return fileType?.startsWith('audio/');
  };

  return (
    <div className="flex flex-col h-full overflow-hidden w-full justify-center items-center">
      {/* Área de scroll para comentários */}
      <div className="flex-1 min-h-0 overflow-hidden px-4 py-4 w-full">
        <ScrollArea className="h-full" ref={scrollAreaRef}>
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-center space-y-2">
              <div className="h-2 w-2 bg-gray-400  rounded-full animate-pulse mx-auto" />
              <p className="text-xs text-muted-foreground">Carregando mensagens...</p>
            </div>
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 px-4">
            <div className="w-12 h-12 rounded-full bg-gray-100  flex items-center justify-center mb-3">
              <Send className="h-5 w-5 text-gray-400 " />
            </div>
            <p className="text-sm font-medium text-gray-600  mb-1">
              Nenhuma mensagem ainda
            </p>
            <p className="text-xs text-muted-foreground text-center max-w-xs">
              Seja o primeiro a comentar neste card
            </p>
          </div>
        ) : (
          <div className="space-y-2.5">
            {messages.map((msg) => {
              const messageUser = getUserById(msg.user_id);
              const isOwnMessage = msg.user_id === currentUserId;

              return (
                <div
                  key={msg.id}
                  className={cn(
                    'flex gap-2.5 group',
                    isOwnMessage && 'flex-row-reverse'
                  )}
                >
                  <Avatar className="h-7 w-7 flex-shrink-0 border border-gray-200 ">
                    <AvatarImage src={messageUser?.avatarUrl || msg.user?.avatar_url || undefined} />
                    <AvatarFallback className="text-xs">
                      {(messageUser?.firstName || messageUser?.email || 'U').charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>

                  <div className={cn('flex-1 min-w-0', isOwnMessage && 'flex flex-col items-end')}>
                    <div className={cn('flex items-baseline gap-2 mb-1', isOwnMessage && 'flex-row-reverse')}>
                      <span className="text-xs font-semibold text-gray-700 ">
                        {messageUser?.firstName && messageUser?.lastName
                          ? `${messageUser.firstName} ${messageUser.lastName}`
                          : messageUser?.email || 'Usuário'}
                      </span>
                      <span className="text-[10px] text-muted-foreground whitespace-nowrap">
                        {formatDistanceToNow(new Date(msg.created_at), {
                          addSuffix: true,
                          locale: ptBR,
                        })}
                      </span>
                    </div>

                    <div className="flex items-start gap-2 w-fit max-w-full">
                      <div
                        className={cn(
                          'rounded-lg px-2.5 py-1.5 max-w-[75%] shadow-sm w-fit min-w-0',
                          isOwnMessage
                            ? 'bg-blue-600 text-white'
                            : 'bg-gray-100  text-gray-900 '
                        )}
                        style={{ boxSizing: 'content-box' }}
                      >
                        {msg.content && (
                          <p className="text-xs leading-relaxed whitespace-pre-wrap break-words">{msg.content}</p>
                        )}

                        {msg.file_url && (
                          <div className={cn('mt-1.5 mx-1.5 mb-1.5', msg.content && 'mt-2')}>
                            {isImage(msg.file_type) ? (
                              <img
                                src={msg.file_url}
                                alt={msg.file_name || 'Imagem'}
                                className="max-w-full max-h-64 rounded-md object-cover"
                              />
                            ) : isVideo(msg.file_type) ? (
                              <video
                                src={msg.file_url}
                                controls
                                className="max-w-full max-h-64 rounded-md"
                              >
                                Seu navegador não suporta vídeo.
                              </video>
                            ) : isAudio(msg.file_type) ? (
                              <AudioPlayer url={msg.file_url} fileName={msg.file_name || 'Áudio'} />
                            ) : (
                              <div className="flex items-center gap-2 p-1.5 bg-white  rounded text-xs">
                                <FileIcon className="h-3.5 w-3.5 flex-shrink-0" />
                                <div className="flex-1 min-w-0">
                                  <p className="font-medium truncate text-xs">
                                    {msg.file_name}
                                  </p>
                                  <p className="text-[10px] text-muted-foreground">
                                    {formatFileSize(msg.file_size || 0)}
                                  </p>
                                </div>
                                <a
                                  href={msg.file_url}
                                  download={msg.file_name}
                                  className="text-blue-600 hover:text-blue-700  :text-blue-300 flex-shrink-0"
                                >
                                  <Download className="h-3.5 w-3.5" />
                                </a>
                              </div>
                            )}
                          </div>
                        )}
                      </div>

                      {isOwnMessage && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                          onClick={() => handleDelete(msg.id)}
                          title="Deletar mensagem"
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
        </ScrollArea>
      </div>

      <div className="flex-shrink-0 border-t border-gray-200  bg-gray-50  px-4 py-3 space-y-2 w-full">
        {selectedFile && !isRecording && (
          <div className="flex items-center gap-2 px-2.5 py-1.5 bg-white  rounded-md border border-gray-200  text-xs">
            <FileIcon className="h-3.5 w-3.5 flex-shrink-0 text-gray-500" />
            <span className="flex-1 truncate text-gray-700 ">{selectedFile.name}</span>
            <Button
              variant="ghost"
              size="sm"
              className="h-5 w-5 p-0 hover:bg-gray-200 :bg-gray-700"
              onClick={() => {
                setSelectedFile(null);
                if (fileInputRef.current) fileInputRef.current.value = '';
                if (videoInputRef.current) videoInputRef.current.value = '';
              }}
            >
              ×
            </Button>
          </div>
        )}

        {isRecording ? (
          /* Modo de gravação: mostrar espectrograma */
          <div className="space-y-3">
            <div className="flex items-center justify-between px-3 py-2 bg-red-50  rounded-md border border-red-200 ">
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 bg-red-500 rounded-full animate-pulse" />
                <span className="text-sm font-medium text-red-600 ">
                  Gravando...
                </span>
                <span className="text-sm font-mono text-red-600 ">
                  {Math.floor(recordingTime / 60)}:{(recordingTime % 60).toString().padStart(2, '0')}
                </span>
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="h-7 px-2 hover:bg-red-100 :bg-red-900/40"
                onClick={cancelRecording}
                title="Cancelar gravação"
              >
                <X className="h-4 w-4 text-red-600 " />
              </Button>
            </div>
            <div className="relative bg-slate-900  rounded-lg overflow-hidden border border-slate-800  shadow-lg">
              <canvas
                ref={canvasRef}
                width={400}
                height={120}
                className="w-full h-[120px]"
              />
            </div>
            <div className="flex gap-2 items-center justify-end">
              <Button
                ref={audioButtonRef}
                variant="destructive"
                size="default"
                className="h-9 px-4 bg-red-500 hover:bg-red-600 text-white font-medium"
                onClick={handleAudioButtonClick}
                title="Parar gravação"
              >
                <Square className="h-4 w-4 mr-2" />
                Parar
              </Button>
            </div>
          </div>
        ) : (
          /* Modo normal: campo de texto e botões */
          <div className="flex gap-2 items-end justify-start  mx-auto w-full">
            <div className="flex-1 max-w-2x8">
              <MentionInput
                value={message}
                onChange={setMessage}
                onMentionsChange={setMentions}
                placeholder="Digite uma mensagem..."
                className="min-h-[36px] text-sm"
              />
            </div>

            <div className="flex gap-2 flex-shrink-0 items-center">
              {/* Botão de gravação de áudio - clicar para iniciar/parar */}
              <Button
                ref={audioButtonRef}
                variant="ghost"
                size="icon"
                className="h-9 w-9"
                onClick={handleAudioButtonClick}
                title="Clique para gravar áudio"
              >
                <Mic className="h-4 w-4" />
              </Button>

              <Button
                size="default"
                className="h-9 px-4 bg-blue-600 hover:bg-blue-700 text-white font-medium"
                onClick={handleSend}
                disabled={sendMessage.isPending || (!message.trim() && !selectedFile)}
              >
                <Send className="h-4 w-4 mr-2" />
                Enviar
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}


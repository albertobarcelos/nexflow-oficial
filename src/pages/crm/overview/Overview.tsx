import { useState, useEffect } from "react";
import { 
  MessageCircle, TrendingUp, Users, Target, Calendar, Bell, ArrowRight, 
  Zap, Brain, Rocket, AlertTriangle, CheckCircle, Clock, DollarSign,
  TrendingDown, Eye, Lightbulb, Activity, BarChart3, Send, Mic,
  Play, Pause, Volume2, Settings, RefreshCw, Star, Flame, Award
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { Textarea } from "@/components/ui/textarea";
import { useIsMobile } from "@/hooks/use-mobile";
import { useNavigate } from "react-router-dom";
import { FlowBasesTestButton } from "@/components/crm/flows/FlowBasesTestButton";

export function Overview() {
  const isMobile = useIsMobile();
  const navigate = useNavigate();
  const [isTyping, setIsTyping] = useState(false);
  const [newMessage, setNewMessage] = useState("");
  const [isListening, setIsListening] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());

  // Atualizar hora em tempo real
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const [messages, setMessages] = useState([
    {
      id: 1,
      type: "ai",
      content: "🔥 **ALERTA CRÍTICO**: Você tem 3 oportunidades de R$ 105.000 que podem ser perdidas hoje! Quer que eu execute o plano de resgate automático?",
      time: "09:15",
      priority: "critical",
      actions: ["Executar Plano", "Ver Detalhes", "Adiar"]
    },
    {
      id: 2,
      type: "ai",
      content: "⚡ **INSIGHT PODEROSO**: Detectei que seus clientes respondem 340% melhor às 14h-16h. Quer que eu reagende automaticamente seus próximos follow-ups?",
      time: "09:16",
      priority: "high",
      actions: ["Reagendar Tudo", "Ver Análise", "Configurar"]
    },
    {
      id: 3,
      type: "ai",
      content: "🎯 **OPORTUNIDADE DE OURO**: Identifiquei 12 leads similares ao seu melhor cliente (TechCorp). Probabilidade de conversão: 87%. Quer que eu prepare as abordagens personalizadas?",
      time: "09:17",
      priority: "opportunity",
      actions: ["Preparar Abordagens", "Ver Leads", "Análise Completa"]
    },
    {
      id: 4,
      type: "ai",
      content: "📊 **PERFORMANCE EXCEPCIONAL**: Você está 127% acima da meta! Baseado no seu padrão, posso prever que fechará R$ 347.000 este mês. Quer que eu ajuste suas metas para maximizar bonificações?",
      time: "09:18",
      priority: "success",
      actions: ["Ajustar Metas", "Ver Projeção", "Estratégia Bonus"]
    }
  ]);

  const aiInsights = [
    {
      type: "critical",
      title: "Risco de Perda Iminente",
      description: "3 deals de alto valor sem follow-up há 48h",
      value: "R$ 105.000",
      action: "Executar sequência de resgate",
      icon: AlertTriangle,
      color: "bg-red-500",
      urgency: "CRÍTICO"
    },
    {
      type: "opportunity",
      title: "Janela de Oportunidade",
      description: "Melhor momento para abordar 8 leads quentes",
      value: "87% conversão",
      action: "Iniciar abordagem automática",
      icon: Target,
      color: "bg-green-500",
      urgency: "AGORA"
    },
    {
      type: "optimization",
      title: "Otimização de Horário",
      description: "Seus clientes respondem 340% melhor às 14h-16h",
      value: "+340% resposta",
      action: "Reagendar automaticamente",
      icon: Clock,
      color: "bg-blue-500",
      urgency: "HOJE"
    },
    {
      type: "prediction",
      title: "Previsão Inteligente",
      description: "Padrão indica fechamento de R$ 347k este mês",
      value: "R$ 347.000",
      action: "Ajustar estratégia",
      icon: TrendingUp,
      color: "bg-purple-500",
      urgency: "PLANEJAMENTO"
    }
  ];

  const proactiveActions = [
    {
      title: "Executar Sequência de Resgate",
      description: "Salvar 3 deals em risco com automação inteligente",
      impact: "R$ 105.000",
      time: "2 min",
      icon: Zap,
      color: "bg-red-500",
      urgent: true
    },
    {
      title: "Preparar Abordagens Personalizadas",
      description: "12 leads similares ao seu melhor cliente",
      impact: "87% conversão",
      time: "5 min",
      icon: Target,
      color: "bg-green-500",
      urgent: false
    },
    {
      title: "Otimizar Agenda da Semana",
      description: "Reagendar reuniões para horários de pico",
      impact: "+340% resposta",
      time: "1 min",
      icon: Calendar,
      color: "bg-blue-500",
      urgent: false
    },
    {
      title: "Análise Competitiva Instantânea",
      description: "Comparar com concorrentes em tempo real",
      impact: "Vantagem estratégica",
      time: "3 min",
      icon: Brain,
      color: "bg-purple-500",
      urgent: false
    }
  ];

  const realTimeStats = [
    {
      title: "Produtividade Hoje",
      value: "347%",
      change: "+127%",
      icon: Rocket,
      color: "text-green-600",
      trend: "up",
      description: "Acima da média histórica"
    },
    {
      title: "Deals em Risco",
      value: "3",
      change: "CRÍTICO",
      icon: AlertTriangle,
      color: "text-red-600",
      trend: "critical",
      description: "Ação necessária agora"
    },
    {
      title: "Oportunidades Quentes",
      value: "12",
      change: "+87%",
      icon: Flame,
      color: "text-orange-600",
      trend: "hot",
      description: "Probabilidade alta"
    },
    {
      title: "Meta do Mês",
      value: "227%",
      change: "+27%",
      icon: Award,
      color: "text-purple-600",
      trend: "excellent",
      description: "Performance excepcional"
    }
  ];

  const handleSendMessage = () => {
    if (!newMessage.trim()) return;
    
    const userMessage = {
      id: messages.length + 1,
      type: "user",
      content: newMessage,
      time: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
    };
    
    setMessages([...messages, userMessage]);
    setNewMessage("");
    setIsTyping(true);
    
    // Simular resposta da IA
    setTimeout(() => {
      const aiResponse = {
        id: messages.length + 2,
        type: "ai",
        content: "🤖 Analisando sua solicitação... Encontrei 3 ações que podem impactar diretamente seus resultados. Quer que eu execute?",
        time: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
        priority: "high",
        actions: ["Executar", "Ver Detalhes", "Personalizar"]
      };
      setMessages(prev => [...prev, aiResponse]);
      setIsTyping(false);
    }, 2000);
  };

  const handleVoiceInput = () => {
    setIsListening(!isListening);
    // Aqui seria implementada a funcionalidade de reconhecimento de voz
  };

  const executeAction = (actionTitle: string) => {
    // Simular execução de ação
    const newAiMessage = {
      id: messages.length + 1,
      type: "ai",
      content: `✅ **AÇÃO EXECUTADA**: ${actionTitle} foi iniciada! Acompanhe o progresso em tempo real no painel.`,
      time: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
      priority: "success"
    };
    setMessages([...messages, newAiMessage]);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header Dinâmico */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="relative">
                <Brain className="h-8 w-8 text-blue-600" />
                <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
              </div>
              <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                Assistente IA Proativo
              </h1>
            </div>
            <p className="text-gray-600 text-lg">
              Impulsionando sua produtividade em <span className="font-bold text-blue-600">tempo real</span> • {currentTime.toLocaleTimeString('pt-BR')}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 px-4 py-2">
              <Activity className="h-4 w-4 mr-2" />
              IA Ativa
            </Badge>
            <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 px-4 py-2">
              <Zap className="h-4 w-4 mr-2" />
              Modo Proativo
            </Badge>
          </div>
        </div>

        {/* Stats em Tempo Real */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {realTimeStats.map((stat, index) => (
            <Card key={index} className="border-0 shadow-lg hover:shadow-xl transition-all duration-300">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-600">{stat.title}</p>
                    <p className="text-3xl font-bold text-gray-900 mt-1">{stat.value}</p>
                    <div className="flex items-center gap-2 mt-2">
                      <Badge 
                        variant={stat.trend === 'critical' ? 'destructive' : stat.trend === 'up' ? 'default' : 'secondary'}
                        className="text-xs"
                      >
                        {stat.change}
                      </Badge>
                      <span className="text-xs text-gray-500">{stat.description}</span>
                    </div>
                  </div>
                  <div className={`p-3 rounded-xl ${stat.color === 'text-red-600' ? 'bg-red-100' : stat.color === 'text-green-600' ? 'bg-green-100' : stat.color === 'text-orange-600' ? 'bg-orange-100' : 'bg-purple-100'}`}>
                    <stat.icon className={`h-6 w-6 ${stat.color}`} />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Central de Comando IA */}
          <div className="lg:col-span-2 space-y-6">
            {/* Insights Críticos */}
            <Card className="border-0 shadow-lg">
              <CardHeader className="bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-t-lg">
                <CardTitle className="flex items-center gap-2">
                  <Brain className="h-5 w-5" />
                  Insights Críticos da IA
                </CardTitle>
                <CardDescription className="text-blue-100">
                  Análise em tempo real • Ações recomendadas • Impacto direto
                </CardDescription>
              </CardHeader>
              <CardContent className="p-6">
                <div className="space-y-4">
                  {aiInsights.map((insight, index) => (
                    <div key={index} className="flex items-start gap-4 p-4 rounded-lg border-l-4 border-l-blue-500 bg-gradient-to-r from-blue-50 to-transparent hover:from-blue-100 transition-all duration-300">
                      <div className={`p-2 rounded-lg ${insight.color} text-white`}>
                        <insight.icon className="h-5 w-5" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-semibold text-gray-900">{insight.title}</h4>
                          <Badge variant="outline" className="text-xs">
                            {insight.urgency}
                          </Badge>
                        </div>
                        <p className="text-sm text-gray-600 mb-2">{insight.description}</p>
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-lg text-blue-600">{insight.value}</span>
                          <Button 
                            size="sm" 
                            onClick={() => executeAction(insight.action)}
                            className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                          >
                            <Zap className="h-4 w-4 mr-2" />
                            {insight.action}
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Chat Inteligente */}
            <Card className="border-0 shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageCircle className="h-5 w-5 text-blue-600" />
                  Conversa com IA
                  {isTyping && (
                    <Badge variant="outline" className="animate-pulse">
                      <Activity className="h-3 w-3 mr-1" />
                      Digitando...
                    </Badge>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4 max-h-96 overflow-y-auto mb-4">
                  {messages.map((message) => (
                    <div
                      key={message.id}
                      className={`flex gap-3 ${
                        message.type === "user" ? "justify-end" : "justify-start"
                      }`}
                    >
                      {message.type === "ai" && (
                        <Avatar className="h-8 w-8 bg-gradient-to-r from-blue-600 to-purple-600">
                          <AvatarFallback className="text-white text-xs">IA</AvatarFallback>
                        </Avatar>
                      )}
                      <div
                        className={`max-w-[85%] rounded-lg p-3 ${
                          message.type === "user"
                            ? "bg-gradient-to-r from-blue-600 to-purple-600 text-white"
                            : "bg-gray-100 text-gray-900"
                        }`}
                      >
                        <p className="text-sm whitespace-pre-line">{message.content}</p>
                        <div className="flex items-center justify-between mt-2">
                          <span className="text-xs opacity-70">{message.time}</span>
                          {message.priority && (
                            <Badge
                              variant={
                                message.priority === "critical" ? "destructive" : 
                                message.priority === "high" ? "default" : 
                                message.priority === "success" ? "default" : "secondary"
                              }
                              className="text-xs"
                            >
                              {message.priority === "critical" ? "CRÍTICO" : 
                               message.priority === "high" ? "URGENTE" : 
                               message.priority === "success" ? "SUCESSO" : 
                               message.priority === "opportunity" ? "OPORTUNIDADE" : "INFO"}
                            </Badge>
                          )}
                        </div>
                        {message.actions && (
                          <div className="flex gap-2 mt-3">
                            {message.actions.map((action, idx) => (
                              <Button
                                key={idx}
                                size="sm"
                                variant="outline"
                                onClick={() => executeAction(action)}
                                className="text-xs"
                              >
                                {action}
                              </Button>
                            ))}
                          </div>
                        )}
                      </div>
                      {message.type === "user" && (
                        <Avatar className="h-8 w-8 bg-gray-200">
                          <AvatarFallback className="text-gray-600 text-xs">EU</AvatarFallback>
                        </Avatar>
                      )}
                    </div>
                  ))}
                </div>
                
                {/* Input de Conversa */}
                <div className="flex gap-2">
                  <Textarea
                    placeholder="Pergunte qualquer coisa ou peça uma ação..."
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    className="flex-1 min-h-[40px] max-h-[120px]"
                    onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), handleSendMessage())}
                  />
                  <div className="flex flex-col gap-2">
                    <Button
                      onClick={handleVoiceInput}
                      variant="outline"
                      size="icon"
                      className={isListening ? "bg-red-100 border-red-300" : ""}
                    >
                      {isListening ? <Volume2 className="h-4 w-4 text-red-600" /> : <Mic className="h-4 w-4" />}
                    </Button>
                    <Button
                      onClick={handleSendMessage}
                      disabled={!newMessage.trim()}
                      className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                    >
                      <Send className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Painel de Ações Proativas */}
          <div className="space-y-6">
            <Card className="border-0 shadow-lg">
              <CardHeader className="bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-t-lg">
                <CardTitle className="flex items-center gap-2">
                  <Zap className="h-5 w-5" />
                  Ações Proativas
                </CardTitle>
                <CardDescription className="text-orange-100">
                  Execute com 1 clique
                </CardDescription>
              </CardHeader>
              <CardContent className="p-6">
                <div className="space-y-4">
                  {proactiveActions.map((action, index) => (
                    <div key={index} className="p-4 rounded-lg border hover:shadow-md transition-all duration-300">
                      <div className="flex items-start gap-3">
                        <div className={`p-2 rounded-lg ${action.color} text-white`}>
                          <action.icon className="h-4 w-4" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="font-semibold text-sm">{action.title}</h4>
                            {action.urgent && (
                              <Badge variant="destructive" className="text-xs">
                                URGENTE
                              </Badge>
                            )}
                          </div>
                          <p className="text-xs text-gray-600 mb-2">{action.description}</p>
                          <div className="flex items-center justify-between">
                            <div className="text-xs">
                              <span className="font-bold text-green-600">{action.impact}</span>
                              <span className="text-gray-500 ml-2">• {action.time}</span>
                            </div>
                            <Button 
                              size="sm" 
                              onClick={() => executeAction(action.title)}
                              className="text-xs"
                            >
                              Executar
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Flows de Teste */}
            <Card className="border-0 shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Eye className="h-5 w-5 text-blue-600" />
                  Testar Flows
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {[
                    { id: "01HZ8XQHBK2QJZXVNR4FGMT3WP", name: "Pipeline Imobiliário" },
                    { id: "01HZ8XQHBK2QJZXVNR4FGMT3WQ", name: "Onboarding SaaS" },
                    { id: "01HZ8XQHBK2QJZXVNR4FGMT3WR", name: "Jornada do Aluno" }
                  ].map((flow) => (
                    <Button
                      key={flow.id}
                      variant="outline"
                      size="sm"
                      className="w-full justify-between"
                      onClick={() => navigate(`/crm/flow/${flow.id}`)}
                    >
                      {flow.name}
                      <ArrowRight className="h-4 w-4" />
                    </Button>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Configurar Entidades */}
            <Card className="border-0 shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="h-5 w-5 text-purple-600" />
                  Configurar Entidades
                </CardTitle>
                <CardDescription>
                  Teste a funcionalidade de vincular bases
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <p className="text-sm text-gray-600">
                    Configure quais entidades (bases de dados) estarão disponíveis em cada flow.
                  </p>
                  <div className="space-y-2">
                    {[
                      { id: "3e36965b-be8f-40cc-a273-08ab2cfc0974", name: "Flow de Vendas" },
                      { id: "01HZ8XQHBK2QJZXVNR4FGMT3WP", name: "Pipeline Imobiliário" },
                      { id: "01HZ8XQHBK2QJZXVNR4FGMT3WQ", name: "Onboarding SaaS" }
                    ].map((flow) => (
                      <div key={flow.id} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                        <span className="text-sm font-medium">{flow.name}</span>
                        <FlowBasesTestButton flowId={flow.id} flowName={flow.name} />
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
} 
import React, { useState, useEffect } from 'react';
import { Brain, Cpu, Clock, MessageSquare, CheckCircle } from 'lucide-react';

interface StreamingState {
  isStreaming: boolean;
  currentPhase: 'thinking' | 'generating' | 'complete';
  tokens: {
    prompt: number;
    completion: number;
    reasoning: number;
    total: number;
  };
  responseText: string;
  timeElapsed: number;
  chunks: number;
  reasoningEffort: 'minimal' | 'low' | 'medium' | 'high';
}

const GPT5StreamingDemo: React.FC = () => {
  const [streamState, setStreamState] = useState<StreamingState>({
    isStreaming: false,
    currentPhase: 'thinking',
    tokens: { prompt: 0, completion: 0, reasoning: 0, total: 0 },
    responseText: '',
    timeElapsed: 0,
    chunks: 0,
    reasoningEffort: 'medium'
  });

  const [question, setQuestion] = useState("Explain quantum computing in simple terms");

  // Simulate streaming response
  const startStreaming = () => {
    setStreamState(prev => ({
      ...prev,
      isStreaming: true,
      currentPhase: 'thinking',
      tokens: { prompt: 45, completion: 0, reasoning: 0, total: 45 },
      responseText: '',
      timeElapsed: 0,
      chunks: 0
    }));

    // Simulate thinking phase
    const thinkingInterval = setInterval(() => {
      setStreamState(prev => ({
        ...prev,
        tokens: {
          ...prev.tokens,
          reasoning: prev.tokens.reasoning + Math.floor(Math.random() * 10) + 5,
          total: prev.tokens.prompt + prev.tokens.completion + prev.tokens.reasoning
        },
        timeElapsed: prev.timeElapsed + 0.1
      }));
    }, 100);

    // Transition to generating after 2 seconds
    setTimeout(() => {
      clearInterval(thinkingInterval);
      setStreamState(prev => ({ ...prev, currentPhase: 'generating' }));

      // Simulate text generation
      const sampleResponse = "Quantum computing is like having a super-powered calculator that can solve certain types of problems much faster than regular computers. Instead of using bits that are either 0 or 1, quantum computers use quantum bits (qubits) that can be both 0 and 1 at the same time - a property called superposition.";
      
      let index = 0;
      const generationInterval = setInterval(() => {
        if (index < sampleResponse.length) {
          const chunk = sampleResponse.slice(index, index + Math.floor(Math.random() * 8) + 1);
          setStreamState(prev => ({
            ...prev,
            responseText: prev.responseText + chunk,
            chunks: prev.chunks + 1,
            tokens: {
              ...prev.tokens,
              completion: prev.tokens.completion + chunk.split(' ').length,
              total: prev.tokens.prompt + prev.tokens.completion + prev.tokens.reasoning
            },
            timeElapsed: prev.timeElapsed + 0.15
          }));
          index += chunk.length;
        } else {
          clearInterval(generationInterval);
          setStreamState(prev => ({
            ...prev,
            isStreaming: false,
            currentPhase: 'complete'
          }));
        }
      }, 150);
    }, 2000);
  };

  const getPhaseIcon = () => {
    switch (streamState.currentPhase) {
      case 'thinking': return <Brain className="w-5 h-5 text-blue-500 animate-pulse" />;
      case 'generating': return <MessageSquare className="w-5 h-5 text-green-500" />;
      case 'complete': return <CheckCircle className="w-5 h-5 text-green-600" />;
    }
  };

  const getPhaseDescription = () => {
    switch (streamState.currentPhase) {
      case 'thinking': return `GPT-5 is reasoning through your question (${streamState.reasoningEffort} effort)...`;
      case 'generating': return 'Generating response...';
      case 'complete': return 'Response complete!';
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white rounded-lg shadow-lg">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-800 mb-4">GPT-5 Streaming Demo</h2>
        
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Your Question:
          </label>
          <input
            type="text"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            disabled={streamState.isStreaming}
          />
        </div>

        <button
          onClick={startStreaming}
          disabled={streamState.isStreaming}
          className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {streamState.isStreaming ? 'Processing...' : 'Ask GPT-5'}
        </button>
      </div>

      {(streamState.isStreaming || streamState.currentPhase === 'complete') && (
        <div className="space-y-4">
          {/* Current Phase Indicator */}
          <div className="flex items-center space-x-3 p-4 bg-gray-50 rounded-lg">
            {getPhaseIcon()}
            <div>
              <div className="font-semibold text-gray-800">
                {streamState.currentPhase.charAt(0).toUpperCase() + streamState.currentPhase.slice(1)}
              </div>
              <div className="text-sm text-gray-600">{getPhaseDescription()}</div>
            </div>
          </div>

          {/* Real-time Metrics */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-blue-50 p-3 rounded-lg">
              <div className="flex items-center space-x-2">
                <Brain className="w-4 h-4 text-blue-600" />
                <span className="text-sm font-medium text-blue-800">Reasoning</span>
              </div>
              <div className="text-xl font-bold text-blue-900">
                {streamState.tokens.reasoning.toLocaleString()}
              </div>
              <div className="text-xs text-blue-600">tokens</div>
            </div>

            <div className="bg-green-50 p-3 rounded-lg">
              <div className="flex items-center space-x-2">
                <MessageSquare className="w-4 h-4 text-green-600" />
                <span className="text-sm font-medium text-green-800">Generated</span>
              </div>
              <div className="text-xl font-bold text-green-900">
                {streamState.tokens.completion.toLocaleString()}
              </div>
              <div className="text-xs text-green-600">tokens</div>
            </div>

            <div className="bg-purple-50 p-3 rounded-lg">
              <div className="flex items-center space-x-2">
                <Cpu className="w-4 h-4 text-purple-600" />
                <span className="text-sm font-medium text-purple-800">Chunks</span>
              </div>
              <div className="text-xl font-bold text-purple-900">
                {streamState.chunks}
              </div>
              <div className="text-xs text-purple-600">received</div>
            </div>

            <div className="bg-orange-50 p-3 rounded-lg">
              <div className="flex items-center space-x-2">
                <Clock className="w-4 h-4 text-orange-600" />
                <span className="text-sm font-medium text-orange-800">Time</span>
              </div>
              <div className="text-xl font-bold text-orange-900">
                {streamState.timeElapsed.toFixed(1)}s
              </div>
              <div className="text-xs text-orange-600">elapsed</div>
            </div>
          </div>

          {/* Token Usage Progress */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Token Usage</span>
              <span>{streamState.tokens.total.toLocaleString()} total</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div className="flex h-2 rounded-full overflow-hidden">
                <div 
                  className="bg-blue-500" 
                  style={{ width: `${(streamState.tokens.reasoning / streamState.tokens.total) * 100}%` }}
                />
                <div 
                  className="bg-green-500" 
                  style={{ width: `${(streamState.tokens.completion / streamState.tokens.total) * 100}%` }}
                />
              </div>
            </div>
            <div className="flex justify-between text-xs text-gray-600">
              <span>🧠 Reasoning: {streamState.tokens.reasoning}</span>
              <span>💬 Response: {streamState.tokens.completion}</span>
            </div>
          </div>

          {/* Streaming Response Text */}
          {streamState.responseText && (
            <div className="mt-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-3">Response:</h3>
              <div className="bg-gray-50 p-4 rounded-lg border">
                <p className="text-gray-800 leading-relaxed">
                  {streamState.responseText}
                  {streamState.currentPhase === 'generating' && (
                    <span className="inline-block w-2 h-5 bg-blue-500 ml-1 animate-pulse" />
                  )}
                </p>
              </div>
            </div>
          )}

          {/* Configuration Display */}
          <div className="text-xs text-gray-500 mt-4 p-3 bg-gray-50 rounded">
            <strong>Configuration:</strong> reasoning_effort: {streamState.reasoningEffort}, 
            verbosity: medium, stream: true
          </div>
        </div>
      )}
    </div>
  );
};

export default GPT5StreamingDemo;
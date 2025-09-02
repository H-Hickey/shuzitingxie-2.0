import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';

import { motion } from 'framer-motion';

export default function Game() {
  const navigate = useNavigate();
  
  // 游戏状态管理
  const [passwordLength, setPasswordLength] = useState(4);
  const [customPassword, setCustomPassword] = useState('');
  const [generatedPassword, setGeneratedPassword] = useState<string[]>([]);
  const [userInput, setUserInput] = useState<string[]>([]);
  const [isListening, setIsListening] = useState(false);
  const [shuffleFrequency, setShuffleFrequency] = useState('every round');
  const [isGameActive, setIsGameActive] = useState(false);
  const [showSettings, setShowSettings] = useState(true);
  const [showSuccessAnimation, setShowSuccessAnimation] = useState(false);
  const [showFailureAnimation, setShowFailureAnimation] = useState(false);
  const [gameMessage, setGameMessage] = useState('Welcome to 数字听写解密!');
  const [messageType, setMessageType] = useState<'info' | 'success' | 'error'>('info');
  const [autoReplayOnError, setAutoReplayOnError] = useState(false);
  const [maxAttempts, setMaxAttempts] = useState(3);
  const [initialMaxAttempts, setInitialMaxAttempts] = useState(maxAttempts);
  const [remainingAttempts, setRemainingAttempts] = useState(maxAttempts);
  
  // 数字键盘状态
  const dialPadOrder = useRef<string[]>(['1', '2', '3', '4', '5', '6', '7', '8', '9', '', '0', '']);
  
  // 初始化和设置管理
  useEffect(() => {
    // 根据设置决定是否生成初始数字键盘顺序
    if (shuffleFrequency !== 'never') {
      shuffleDialPad();
    } else {
      // 恢复默认数字顺序
      dialPadOrder.current = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '', '0', ''];
    }
    // 生成默认密码
    generateRandomPassword();
  }, [shuffleFrequency]);
  
  // 密码生成函数
  const generateRandomPassword = () => {
    const newPassword: string[] = [];
    for (let i = 0; i < passwordLength; i++) {
      newPassword.push(Math.floor(Math.random() * 10).toString());
    }
    setGeneratedPassword(newPassword);
    setCustomPassword('');
  };
  
  // 自定义密码处理函数
  const handleCustomPasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/[^0-9]/g, ''); // 只允许数字输入
    if (value.length <= passwordLength) {
      setCustomPassword(value);
    }
  };
  
  // 应用自定义密码
  const applyCustomPassword = () => {
    if (customPassword.length === passwordLength) {
      setGeneratedPassword(customPassword.split(''));
      setGameMessage('自定义密码已设置!点击"听取密码"开始游戏');
      return true;
    }
    setGameMessage(`请输入${passwordLength}位数字作为密码`);
    setMessageType('error');
    return false;
  };
  
  // 打乱数字键盘
  const shuffleDialPad = () => {
    // 创建数字副本
    const numbers = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '0'];
    // 简单洗牌算法 - Fisher-Yates shuffle
    for (let i = numbers.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [numbers[i], numbers[j]] = [numbers[j], numbers[i]];
    }
    // 按照电话键盘布局重新排列 (保留空位置)
    dialPadOrder.current = [
      numbers[0], numbers[1], numbers[2],
      numbers[3], numbers[4], numbers[5],
      numbers[6], numbers[7], numbers[8],
      '', numbers[9], ''
    ];
  };
  
   // 语音播放函数
  const speakPassword = () => {
    // 检查浏览器是否支持Web Speech API
    if (!('speechSynthesis' in window)) {
      setGameMessage('您的浏览器不支持语音合成功能，请使用最新版Chrome、Firefox或Safari浏览器');
      setMessageType('error');
      return;
    }
    
    setIsListening(true);
    setGameMessage('正在播放密码...');
    setMessageType('info');
    
    try {
      const utterance = new SpeechSynthesisUtterance();
      utterance.lang = 'zh-CN'; // 设置中文语音
       utterance.text = generatedPassword.join('，'); // 使用中文逗号分隔数字，更清晰
      utterance.rate = 0.8; // 语速稍慢，便于听清
      
      utterance.onend = () => {
        setIsListening(false);
        setIsGameActive(true);
        setGameMessage(`请注意数字键盘，输入${passwordLength}位密码`);
      };
      
      utterance.onerror = (event) => {
        setIsListening(false);
        setGameMessage(`语音播放失败: ${event.error}`);
        setMessageType('error');
      };
      
      window.speechSynthesis.speak(utterance);
    } catch (error) {
      setIsListening(false);
      setGameMessage(`语音合成初始化失败: ${error instanceof Error ? error.message : '未知错误'}`);
      setMessageType('error');
    }
  };
  
  // Button click sound effect using Web Audio API
  const playButtonSound = () => {
    try {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      oscillator.type = 'sine';
      oscillator.frequency.setValueAtTime(330, audioContext.currentTime); // A4 note
      gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
      
      oscillator.start();
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.2);
      oscillator.stop(audioContext.currentTime + 0.2);
    } catch (error) {
      console.error('播放音效失败:', error);
    }
  };
  
  // Handle number button click
  const handleNumberClick = (number: string) => {
    if (!isGameActive || number === '') {
      return;
    }
    
    playButtonSound();
    const newInput = [...userInput, number];
    setUserInput(newInput);
    
    // Check if input is complete
    if (newInput.length === passwordLength) {
      setIsGameActive(false);
      
      // Check if password matches
       const isSuccess = newInput.join('') === generatedPassword.join('');
       
       if (isSuccess) {
         // Success effect with animation
         setGameMessage('解密成功!恭喜你!');
         setMessageType('success');
         setShowSuccessAnimation(true);
         setTimeout(() => setShowSuccessAnimation(false), 2000);
         
         // Apply shuffle settings
         if (shuffleFrequency === 'every game' || shuffleFrequency === 'every round') {
           shuffleDialPad();
         }
         
         // Generate new password for next round
         generateRandomPassword();
         // 重置剩余尝试次数
         setRemainingAttempts(maxAttempts);
         
       } else {
         // 减少剩余尝试次数
         const newRemainingAttempts = remainingAttempts - 1;
         setRemainingAttempts(newRemainingAttempts);
         
         // Failure feedback with animation
         setGameMessage(newRemainingAttempts > 0 
           ? `密码错误，请重试 | 剩余尝试次数: ${newRemainingAttempts}` 
           : '游戏结束! 尝试次数已用尽');
         setMessageType('error');
         setShowFailureAnimation(true);
         setTimeout(() => setShowFailureAnimation(false), 1000);
         
         // 如果启用了自动重听且还有剩余尝试次数，自动重听密码
         if (autoReplayOnError && newRemainingAttempts > 0) {
           setTimeout(() => {
             speakPassword();
           }, 1500); // 短暂延迟后重听
         }
         
         // 如果尝试次数用尽，结束游戏
         if (newRemainingAttempts <= 0) {
           setIsGameActive(false);
         }
       }
      
      // Clear input after short delay
      setTimeout(() => {
        setUserInput([]);
      }, 1000);
    }
  };
  
  // 开始新游戏
  const startNewGame = () => {
    setUserInput([]);
    setIsGameActive(false);
    
    // 根据设置决定是否打乱键盘
    if (shuffleFrequency === 'every game' || shuffleFrequency === 'every round') {
      shuffleDialPad();
    }
    
    // 如果没有自定义密码，则生成新密码
    if (!customPassword) {
       generateRandomPassword();
     }
     
     // 重置剩余尝试次数
      setInitialMaxAttempts(maxAttempts);
      setRemainingAttempts(maxAttempts);
      setGameMessage(`点击下方按钮听取密码 | 剩余尝试次数: ${maxAttempts}`);
  };
  
  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-blue-50 to-green-50 p-4">
      {/* Header */}
      <header className="flex justify-between items-center mb-6">
        <button 
          onClick={() => navigate('/')}
          className="bg-white/80 backdrop-blur-sm px-4 py-2 rounded-full shadow-md text-blue-500 font-medium flex items-center space-x-2 transition-transform hover:scale-105"
        >
          <i class="fa-solid fa-arrow-left"></i>
          <span>返回首页</span>
        </button>
        
        <h1 className="text-2xl md:text-3xl font-bold text-primary animate-pulse">数字听写解密</h1>
        
        <button 
          onClick={() => setShowSettings(!showSettings)}
          className="bg-white/80 backdrop-blur-sm p-2 rounded-full shadow-md text-blue-500 transition-transform hover:scale-105"
        >
          <i class="fa-solid fa-cog"></i>
        </button>
      </header>
      
      {/* Settings Panel */}
      {showSettings && (
        <div className="bg-white/90 backdrop-blur-sm p-6 rounded-2xl shadow-lg mb-6 animate-fadeIn">
          <h2 className="text-xl font-bold mb-4 text-center text-blue-600">游戏设置</h2>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">密码位数</label>
              <input
                type="range"
                min="3"
                max="8"
                value={passwordLength}
                onChange={(e) => setPasswordLength(Number(e.target.value))}
                className="w-full accent-blue-500"
              />
              <div className="flex justify-between text-xs text-gray-500 mt-1">
                <span>3位</span>
                <span className="font-bold text-blue-500">{passwordLength}位</span>
                <span>8位</span>
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">数字盘打乱频率</label>
              <select
                value={shuffleFrequency}
                onChange={(e) => setShuffleFrequency(e.target.value)}
                className="w-full bg-gray-100 border border-gray-200 text-gray-700 py-2 px-3 pr-8 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="every game">每次游戏打乱</option>
                <option value="every round">每轮挑战打乱</option>
                <option value="never">从不打乱</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                自定义密码 ({passwordLength}位数字)
              </label>
              <div className="flex space-x-2">
                <input
                  type="text"
                  value={customPassword}
                  onChange={handleCustomPasswordChange}
                  maxLength={passwordLength}
                  minLength={passwordLength}
                  placeholder={`输入${passwordLength}位数字`}
                  className="flex-1 bg-gray-100 border border-gray-200 text-gray-700 py-2 px-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button
                  onClick={applyCustomPassword}
                  className="bg-blue-500 text-white py-2 px-4 rounded-lg hover:bg-blue-600 transition-colors"
                >
                  应用
                </button>
              </div>
            </div>
            
            <div className="text-center">
              <button
                onClick={() => {
                  generateRandomPassword();
                  setCustomPassword('');
                }}
                className="text-sm text-blue-500 hover:text-blue-700"
              >
                <i class="fa-solid fa-refresh mr-1"></i>
                随机生成密码
              </button>
            </div>
          </div>
          
          {/* 自动重听和尝试次数设置 */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6 pt-6 border-t border-gray-100">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">密码错误自动重听</label>
              <div className="flex items-center">
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={autoReplayOnError}
                    onChange={(e) => setAutoReplayOnError(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-500"></div>
                </label>
                <span className="ml-2 text-sm text-gray-600">
                  {autoReplayOnError ? '启用' : '禁用'}
                </span>
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">最大尝试次数</label>
              <div className="flex items-center space-x-3">
        <input
          type="range"
          min="1"
          max="10"
          disabled={isGameActive}
          value={maxAttempts}
          className="flex-1 accent-blue-500 disabled:opacity-50"
                  onChange={(e) => setMaxAttempts(Number(e.target.value))}
                  className="flex-1 accent-blue-500"
                />
                <span className="font-bold text-blue-500 w-8 text-center">{maxAttempts}</span>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Game Status Display with Animation */}
      <motion.div 
        className={`p-4 rounded-2xl mb-6 mx-auto max-w-md text-center transition-all duration-300 ${
          messageType === 'success' ? 'bg-green-100 text-green-800 border-2 border-green-300' :
          messageType === 'error' ? 'bg-red-100 text-red-800 border-2 border-red-300' :
          'bg-blue-100 text-blue-800 border-2 border-blue-300'
        }`}
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      >
         <div className="flex flex-col items-center">
           <p className="text-lg font-medium">{gameMessage}</p>
           {remainingAttempts < maxAttempts && remainingAttempts > 0 && (
             <div className="mt-2 flex items-center text-sm text-gray-500">
               <i class="fa-solid fa-clock-rotate-left mr-1"></i>
                <span>剩余尝试次数: {remainingAttempts}/{initialMaxAttempts}</span>
             </div>
           )}
         </div>
        
        {/* Password input visualization */}
        {isGameActive && (
          <div className="mt-4 flex justify-center space-x-3">
            {Array.from({ length: passwordLength }).map((_, index) => (
              <motion.div 
                key={index} 
                className={`w-10 h-10 rounded-full flex items-center justify-center ${
                  index < userInput.length ? 'bg-blue-500 text-white' : 'bg-white/50 border-2 border-gray-300'
                }`}
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: index * 0.1 }}
              >
                {index < userInput.length && (
                  <span className="font-bold">{userInput[index]}</span>
                )}
              </motion.div>
            ))}
          </div>
        )}
      </motion.div>
      
      {/* Success Animation */}
      {showSuccessAnimation && (
        <motion.div 
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div 
            className="bg-white p-8 rounded-2xl text-center"
            initial={{ scale: 0.5 }}
            animate={{ scale: 1.2 }}
            transition={{ type: 'spring', stiffness: 200, damping: 20 }}
          >
            <motion.div 
              className="text-6xl text-green-500 mb-4"
              animate={{ rotate: 360, scale: [1, 1.5, 1] }}
              transition={{ duration: 1 }}
            >
              <i class="fa-solid fa-check-circle"></i>
            </motion.div>
            <h2 className="text-2xl font-bold text-green-600 mb-2">解密成功!</h2>
            <p className="text-gray-600">恭喜你完成了挑战!</p>
          </motion.div>
        </motion.div>
      )}
      
      {/* Failure Animation */}
      {showFailureAnimation && (
        <motion.div 
          className="fixed inset-0 flex items-center justify-center z-50 pointer-events-none"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div 
            className="text-6xl text-red-500"
            animate={{ x: [0, -20, 20, -20, 20, 0], opacity: [1, 0.5, 1] }}
            transition={{ duration: 0.5 }}
          >
            <i class="fa-solid fa-times-circle"></i>
          </motion.div>
        </motion.div>
      )}
      
      {/* Main Game Area */}
      <main className="flex-1 flex justify-center">
        <div className="w-full max-w-md">
          {/* Number keypad */}
          <div className="grid grid-cols-3 gap-4 mb-8">
            {dialPadOrder.current.map((number, index) => (
              <button
                key={index}
                className={`aspect-square rounded-2xl flex items-center justify-center text-2xl font-bold transition-all duration-200 transform hover:scale-105 
                  ${number === '' 
                    ? 'opacity-0 cursor-default' 
                    : 'bg-white shadow-lg hover:shadow-xl active:scale-95'
                  }`}
                onClick={() => handleNumberClick(number)}
                disabled={!isGameActive || number === ''}
              >
                {number && number}
              </button>
            ))}
          </div>
          
          {/* Control buttons */}
          <div className="grid grid-cols-2 gap-4">
            <button
              disabled={isListening || isGameActive}
              onClick={speakPassword}
              className="bg-blue-400 hover:bg-blue-500 text-white py-3 px-4 rounded-xl shadow-lg transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <i class="fa-solid fa-volume-up mr-2"></i>
              听取密码
            </button>
            
            <button
              onClick={startNewGame}
              className="bg-green-400 hover:bg-green-500 text-white py-3 px-4 rounded-xl shadow-lg transition-all active:scale-95"
            >
              <i class="fa-solid fa-play mr-2"></i>
              新的挑战
            </button>
          </div>
        </div>
      </main>
      
      {/* Footer */}
      <footer className="mt-8 mb-4 text-center text-sm text-gray-500">
        <p>数字听写解密1.0 | 点击数字按钮输入听到的密码序列</p>
      </footer>
    </div>
  );
}
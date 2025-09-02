import { useEffect } from 'react';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';

export default function Home() {
  const navigate = useNavigate();
  useEffect(() => {
    // 检查是否是首次访问游戏
    const hasVisitedGame = localStorage.getItem('hasVisitedGame');
    if (!hasVisitedGame) {
      // 可以在这里添加首次访问的逻辑
      localStorage.setItem('hasVisitedGame', 'true');
    }
  }, []);

  const openGame = () => {
    try {
      // 使用React Router导航到游戏页面
      navigate('/game');
    } catch (error) {
      console.error('打开游戏失败:', error);
      toast.error('打开游戏失败，请刷新页面重试。');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-green-50 flex flex-col items-center justify-center p-4">
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold text-blue-500 mb-4 animate-bounce">数字听写解密1.0</h1>
        <p className="text-gray-600 max-w-md">一款通过聆听数字序列来解密的可爱风格小游戏，锻炼你的记忆力和听力！</p>
      </div>
      
      <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-md">
        <div className="flex justify-center mb-6">
          <div className="w-40 h-40 bg-blue-100 rounded-full flex items-center justify-center">
            <span className="text-5xl text-blue-400">🔑</span>
          </div>
        </div>
        
        <button 
          onClick={openGame}
          className="w-full bg-blue-400 hover:bg-blue-500 text-white font-bold py-4 px-6 rounded-xl transition-all duration-300 transform hover:scale-105 shadow-lg"
        >
          <span>▶️</span> 开始游戏
        </button>
        
        <div className="mt-6 text-center text-sm text-gray-500">
          <p>点击按钮开始游戏</p>
          <p className="mt-2">游戏支持离线游玩，无需网络连接</p>
        </div>
      </div>
      
      <div className="mt-8 grid grid-cols-3 gap-4 w-full max-w-md">
        <div className="bg-white rounded-xl p-4 shadow text-center">
          <span className="text-green-400 text-2xl mb-2">🎤</span>
          <p className="text-sm">语音听写</p>
        </div>
        <div className="bg-white rounded-xl p-4 shadow text-center">
          <span className="text-purple-400 text-2xl mb-2">🔒</span>
          <p className="text-sm">密码挑战</p>
        </div>
        <div className="bg-white rounded-xl p-4 shadow text-center">
          <span className="text-yellow-400 text-2xl mb-2">⚙️</span>
          <p className="text-sm">难度调节</p>
        </div>
      </div>
    </div>
  );
}
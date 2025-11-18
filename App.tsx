
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Message, Restaurant } from './types';
import { getFoodRecommendations } from './services/geminiService';
import { ChatMessage } from './components/ChatMessage';
import { IconSend, IconLocation, IconBot, IconStar } from './components/Icons';

const App: React.FC = () => {
    const [messages, setMessages] = useState<Message[]>([]);
    const [userInput, setUserInput] = useState<string>('');
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [location, setLocation] = useState<{ latitude: number; longitude: number } | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [minRating, setMinRating] = useState<number>(3);
    const chatEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);
    
    const initializeChat = useCallback(() => {
        setMessages([
            {
                id: 'init-1',
                role: 'model',
                text: 'Xin chào! Mình là chatbot gợi ý quán ăn. Bạn muốn ăn gì hôm nay?',
            }
        ]);
        setIsLoading(false);
    }, []);

    useEffect(() => {
        setIsLoading(true);
        navigator.geolocation.getCurrentPosition(
            (position) => {
                setLocation({
                    latitude: position.coords.latitude,
                    longitude: position.coords.longitude,
                });
                setError(null);
                initializeChat();
            },
            (err) => {
                setError(`Lỗi xác định vị trí: ${err.message}. Vui lòng cho phép truy cập vị trí và làm mới trang.`);
                setIsLoading(false);
            },
            { enableHighAccuracy: true }
        );
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!userInput.trim() || isLoading || !location) return;

        const userMessage: Message = { id: Date.now().toString(), role: 'user', text: userInput };
        setMessages(prev => [...prev, userMessage]);
        setUserInput('');
        setIsLoading(true);

        const { text, restaurants } = await getFoodRecommendations(userInput, messages, location, minRating);

        const modelMessage: Message = {
            id: (Date.now() + 1).toString(),
            role: 'model',
            text: text,
            restaurants: restaurants.length > 0 ? restaurants : undefined,
        };
        setMessages(prev => [...prev, modelMessage]);
        setIsLoading(false);
    };

    return (
        <div className="flex flex-col h-screen bg-white dark:bg-gray-800 font-sans">
            <header className="flex items-center p-4 border-b border-gray-200 dark:border-gray-700 shadow-sm sticky top-0 bg-white dark:bg-gray-800 z-10">
                <IconBot className="w-8 h-8 text-indigo-500" />
                <h1 className="text-xl font-bold ml-3 text-gray-800 dark:text-gray-100">AI Food Finder</h1>
            </header>

            <main className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6">
                {messages.map(msg => (
                    <ChatMessage key={msg.id} message={msg} />
                ))}
                {isLoading && (
                     <div className="flex items-center space-x-3 self-start">
                        <div className="w-10 h-10 rounded-full bg-indigo-500 flex items-center justify-center flex-shrink-0">
                            <IconBot className="w-6 h-6 text-white" />
                        </div>
                        <div className="p-3 bg-gray-200 dark:bg-gray-700 rounded-lg">
                           <div className="flex items-center justify-center space-x-2">
                                <div className="w-2 h-2 rounded-full bg-gray-500 animate-pulse"></div>
                                <div className="w-2 h-2 rounded-full bg-gray-500 animate-pulse [animation-delay:0.2s]"></div>
                                <div className="w-2 h-2 rounded-full bg-gray-500 animate-pulse [animation-delay:0.4s]"></div>
                           </div>
                        </div>
                    </div>
                )}
                 {error && (
                    <div className="flex items-center p-4 bg-red-100 dark:bg-red-900/50 text-red-700 dark:text-red-300 rounded-lg">
                        <IconLocation className="w-6 h-6 mr-3"/>
                        <p>{error}</p>
                    </div>
                )}
                <div ref={chatEndRef} />
            </main>

            <footer className="p-4 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 sticky bottom-0">
                <form onSubmit={handleSendMessage} className="flex items-center space-x-3 max-w-3xl mx-auto">
                    <input
                        type="text"
                        value={userInput}
                        onChange={e => setUserInput(e.target.value)}
                        placeholder={location ? "Tìm phở, bún chả, hoặc sushi..." : "Đang chờ vị trí của bạn..."}
                        className="flex-1 p-3 border border-gray-300 dark:border-gray-600 rounded-full focus:ring-2 focus:ring-indigo-500 focus:outline-none bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100 disabled:opacity-50"
                        disabled={isLoading || !location}
                    />
                    <button
                        type="submit"
                        disabled={isLoading || !userInput.trim() || !location}
                        className="p-3 bg-indigo-500 text-white rounded-full hover:bg-indigo-600 disabled:bg-indigo-300 dark:disabled:bg-indigo-800 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 dark:focus:ring-offset-gray-800 transition-colors"
                    >
                        <IconSend className="w-6 h-6"/>
                    </button>
                </form>
                <div className="max-w-3xl mx-auto mt-3 flex items-center justify-center space-x-4">
                    <label htmlFor="rating-slider" className="text-sm font-medium text-gray-700 dark:text-gray-300 whitespace-nowrap">
                        Đánh giá tối thiểu
                    </label>
                    <input
                        id="rating-slider"
                        type="range"
                        min="1"
                        max="5"
                        step="0.5"
                        value={minRating}
                        onChange={e => setMinRating(parseFloat(e.target.value))}
                        className="w-full max-w-xs h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-600 accent-indigo-500"
                        disabled={isLoading || !location}
                    />
                     <div className="flex items-center space-x-1 w-20">
                        <span className="font-semibold text-indigo-600 dark:text-indigo-400 text-sm">{minRating.toFixed(1)}</span>
                        <IconStar className="w-4 h-4 text-yellow-400" />
                    </div>
                </div>
            </footer>
        </div>
    );
};

export default App;
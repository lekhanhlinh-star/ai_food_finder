
import React from 'react';
import { Message } from '../types';
import { RestaurantCard } from './RestaurantCard';
import { IconBot, IconUser } from './Icons';

interface ChatMessageProps {
    message: Message;
}

export const ChatMessage: React.FC<ChatMessageProps> = ({ message }) => {
    const isModel = message.role === 'model';

    return (
        <div className={`flex items-start gap-4 ${isModel ? '' : 'flex-row-reverse'}`}>
            <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${isModel ? 'bg-indigo-500' : 'bg-gray-500'}`}>
                {isModel ? <IconBot className="w-6 h-6 text-white" /> : <IconUser className="w-6 h-6 text-white" />}
            </div>
            <div className={`max-w-xl md:max-w-2xl ${isModel ? 'order-first' : 'order-last'}`}>
                 <div className={`p-4 rounded-2xl ${isModel ? 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-100 rounded-tl-none' : 'bg-indigo-500 text-white rounded-tr-none'}`}>
                    <p className="whitespace-pre-wrap">{!message.restaurants ? message.text : "Mình tìm thấy một vài quán ăn phù hợp cho bạn:"}</p>
                </div>
                {message.restaurants && (
                    <div className="mt-4 grid grid-cols-1 gap-4">
                        {message.restaurants.map((restaurant, index) => (
                            <RestaurantCard key={index} restaurant={restaurant} />
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

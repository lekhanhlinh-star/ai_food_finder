import React, { useState } from 'react';
import { Restaurant } from '../types';
import { IconCuisine, IconHours, IconMaps, IconNote, IconSparkles, IconStar, IconReview, IconChevronDown } from './Icons';

interface RestaurantCardProps {
    restaurant: Restaurant;
}

export const RestaurantCard: React.FC<RestaurantCardProps> = ({ restaurant }) => {
    const [isExpanded, setIsExpanded] = useState(false);
    const hasReviews = restaurant.reviews && restaurant.reviews.length > 0;

    return (
        <div className="bg-white dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600 rounded-lg shadow-md hover:shadow-lg transition-shadow duration-300 overflow-hidden">
            <div className="p-5">
                <div className="flex justify-between items-start">
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white">{restaurant.name}</h3>
                    {restaurant.mapsLink !== '#' && (
                        <a 
                            href={restaurant.mapsLink} 
                            target="_blank" 
                            rel="noopener noreferrer" 
                            className="ml-4 flex-shrink-0 flex items-center space-x-2 px-3 py-1 bg-blue-500 text-white text-sm font-semibold rounded-full hover:bg-blue-600 transition-colors"
                        >
                            <IconMaps className="w-4 h-4" />
                            <span>Bản đồ</span>
                        </a>
                    )}
                </div>
                
                <div className="mt-4 space-y-3 text-gray-600 dark:text-gray-300">
                    <div className="flex items-center">
                        <IconCuisine className="w-5 h-5 mr-3 text-indigo-400" />
                        <span className="font-medium">Món ăn:</span>
                        <span className="ml-2">{restaurant.cuisine}</span>
                    </div>
                     <div className="flex items-center">
                        <IconStar className="w-5 h-5 mr-3 text-yellow-400" />
                        <span className="font-medium">Đánh giá:</span>
                        <span className="ml-2">{restaurant.rating}</span>
                    </div>
                    <div className="flex items-center">
                        <IconSparkles className="w-5 h-5 mr-3 text-orange-400" />
                        <span className="font-medium">Món đặc sắc:</span>
                        {restaurant.signatureDish ? (
                            <span className="ml-2">{restaurant.signatureDish}</span>
                        ) : (
                            <span className="ml-2 text-gray-500 dark:text-gray-400 italic">Món đặc sắc chưa có thông tin</span>
                        )}
                    </div>
                    <div className="flex items-center">
                        <IconHours className="w-5 h-5 mr-3 text-green-400" />
                        <span className="font-medium">Giờ mở cửa:</span>
                        <span className="ml-2">{restaurant.hours}</span>
                    </div>
                     {restaurant.note && (
                        <div className="flex items-start">
                            <IconNote className="w-5 h-5 mr-3 mt-1 text-gray-400 flex-shrink-0" />
                            <div>
                                <span className="font-medium">Ghi chú:</span>
                                <p className="text-sm italic">{restaurant.note}</p>
                            </div>
                        </div>
                    )}
                </div>

                {hasReviews && (
                    <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-600">
                        <button 
                            onClick={() => setIsExpanded(!isExpanded)}
                            className="flex items-center justify-between w-full text-left text-sm font-medium text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300"
                            aria-expanded={isExpanded}
                        >
                            <span>{isExpanded ? 'Ẩn đánh giá' : 'Xem đánh giá'}</span>
                            <IconChevronDown className={`w-5 h-5 transition-transform duration-300 ${isExpanded ? 'transform rotate-180' : ''}`} />
                        </button>
                        <div className={`overflow-hidden transition-all duration-500 ease-in-out ${isExpanded ? 'max-h-96 mt-3' : 'max-h-0'}`}>
                            <div className="space-y-3">
                                {restaurant.reviews?.map((review, index) => (
                                    <div key={index} className="flex items-start">
                                        <IconReview className="w-4 h-4 mr-3 mt-1 text-gray-400 flex-shrink-0" />
                                        <p className="text-sm text-gray-600 dark:text-gray-300 italic">"{review}"</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};
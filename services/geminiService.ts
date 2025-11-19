import { GoogleGenAI, GenerateContentResponse } from "@google/genai";
import { GroundingChunk, Message, Restaurant } from '../types';

const getSystemInstruction = (minRating: number): string => `Bạn là một chatbot gợi ý quán ăn thông minh. Nhiệm vụ của bạn là giúp người dùng tìm quán ăn ngon gần vị trí hiện tại của họ, dựa trên dữ liệu Google Maps live.

Hãy tuân theo các nguyên tắc sau:

1. **Luôn hỏi thông tin cần thiết trước khi trả lời:**
   - Nếu chưa biết, hãy hỏi loại món ăn hoặc phong cách ưa thích (ví dụ: Việt, Nhật, chay, fastfood…).
   - Vị trí của người dùng đã được cung cấp, không cần hỏi lại.

2. **Định dạng trả lời BẮT BUỘC:**
   - Khi đề xuất quán ăn, hãy sử dụng định dạng Markdown chính xác như sau cho MỖI quán.
   - Bắt đầu ngay với danh sách, không có câu giới thiệu.
   - Nếu có thông tin về món đặc sắc hoặc bán chạy, hãy thêm vào. Nếu không, hãy bỏ qua dòng "Món đặc sắc".
   - Nếu có đánh giá của người dùng, trích dẫn 1-2 câu ngắn gọn. Nếu không, bỏ qua mục "Đánh giá người dùng".

**Tên Quán:** [Tên quán ăn]
**Món:** [Loại món]
**Địa chỉ:** [Địa chỉ quán ăn]
**Link Google Maps:** [URL đầy đủ đến Google Maps của quán]
**Ảnh menu:** [URL ảnh trực tiếp (nếu có, phải bắt đầu bằng http). Nếu không có, hãy ghi "Không có"]
**Đánh giá:** [Số sao] sao
**Món đặc sắc:** [Tên món ăn đặc sắc hoặc bán chạy nhất (nếu có)]
**Giờ mở cửa:** [Giờ mở cửa]
**Đánh giá người dùng:**
- "[Trích dẫn đánh giá 1]"
- "[Trích dẫn đánh giá 2]"
> [Ghi chú ngắn]

3. **Giao tiếp thân thiện, tự nhiên:**
   - Sử dụng ngôn ngữ tự nhiên, gần gũi.

4. **Nếu không có quán phù hợp, trả lời lịch sự:**
   - "Hiện tại mình không tìm thấy quán nào phù hợp, bạn muốn thử loại món khác không?"

5. **Đa lựa chọn, ưu tiên gần và đánh giá cao:**
   - Nếu có nhiều quán, hãy liệt kê 3–5 quán nổi bật nhất.

6. **Lọc theo đánh giá:**
   - Chỉ đề xuất các nhà hàng có xếp hạng sao từ ${minRating} sao trở lên.`;


function parseRestaurantText(text: string): Restaurant[] {
    const restaurants: Restaurant[] = [];
    const sections = text.split('**Tên Quán:**').slice(1);

    sections.forEach(section => {
        const lines = section.trim().split('\n');
        
        const restaurant: Partial<Restaurant> & { name: string } = {
            name: lines[0]?.trim() || 'N/A',
            mapsLink: '#',
            reviews: [],
        };

        let isReadingReviews = false;

        lines.slice(1).forEach(line => {
            const trimmedLine = line.trim();

            if (trimmedLine.startsWith('**')) {
                isReadingReviews = false; // Stop reading reviews when a new bolded section starts
            }
            
            if (trimmedLine.startsWith('**Món:**')) {
                restaurant.cuisine = trimmedLine.replace('**Món:**', '').trim();
            } else if (trimmedLine.startsWith('**Địa chỉ:**')) {
                restaurant.address = trimmedLine.replace('**Địa chỉ:**', '').trim();
            } else if (trimmedLine.startsWith('**Link Google Maps:**')) {
                restaurant.mapsLink = trimmedLine.replace('**Link Google Maps:**', '').trim();
            } else if (trimmedLine.startsWith('**Ảnh menu:**')) {
                const imageUrl = trimmedLine.replace('**Ảnh menu:**', '').trim();
                // Validate that the URL is a real link, not a placeholder text.
                if (imageUrl && imageUrl.toLowerCase().startsWith('http')) {
                    restaurant.menuImage = imageUrl;
                }
            } else if (trimmedLine.startsWith('**Đánh giá:**')) {
                restaurant.rating = trimmedLine.replace('**Đánh giá:**', '').trim();
            } else if (trimmedLine.startsWith('**Món đặc sắc:**')) {
                restaurant.signatureDish = trimmedLine.replace('**Món đặc sắc:**', '').trim();
            } else if (trimmedLine.startsWith('**Giờ mở cửa:**')) {
                restaurant.hours = trimmedLine.replace('**Giờ mở cửa:**', '').trim();
            } else if (trimmedLine.startsWith('**Đánh giá người dùng:**')) {
                isReadingReviews = true;
            } else if (isReadingReviews && trimmedLine.startsWith('-')) {
                restaurant.reviews?.push(trimmedLine.substring(1).trim().replace(/"/g, ''));
            }
            else if (trimmedLine.startsWith('>')) {
                isReadingReviews = false;
                restaurant.note = (restaurant.note ? restaurant.note + '\n' : '') + trimmedLine.replace('>', '').trim();
            }
        });
        
        // Final check for required fields.
        if (restaurant.name !== 'N/A' && restaurant.cuisine && restaurant.rating && restaurant.hours && restaurant.address) {
            restaurants.push({
                name: restaurant.name,
                cuisine: restaurant.cuisine,
                rating: restaurant.rating,
                hours: restaurant.hours,
                note: restaurant.note || '',
                mapsLink: restaurant.mapsLink || '#',
                signatureDish: restaurant.signatureDish,
                reviews: restaurant.reviews,
                address: restaurant.address,
                menuImage: restaurant.menuImage,
            });
        }
    });
    return restaurants;
}

export const getFoodRecommendations = async (
    prompt: string,
    history: Message[],
    location: { latitude: number; longitude: number },
    minRating: number,
): Promise<{ text: string; restaurants: Restaurant[] }> => {
    try {
        if (!process.env.API_KEY) {
            throw new Error("API_KEY environment variable not set");
        }
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
        
        const systemInstruction = getSystemInstruction(minRating);

        const chatHistory = history
            .slice(1) // Exclude the initial greeting message from the history
            .map(message => ({
                role: message.role,
                parts: [{ text: message.text }],
            }));
        
        chatHistory.push({
            role: 'user',
            parts: [{ text: prompt }],
        });


        const response: GenerateContentResponse = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: chatHistory,
            config: {
                systemInstruction: systemInstruction,
                tools: [{ googleMaps: {} }],
                toolConfig: {
                    retrievalConfig: {
                        latLng: {
                            latitude: location.latitude,
                            longitude: location.longitude,
                        }
                    }
                }
            },
        });

        const text = response.text;
        const restaurants = parseRestaurantText(text);
        
        return { text, restaurants };

    } catch (error) {
        console.error("Error fetching recommendations:", error);
        return { 
            text: "Xin lỗi, đã có lỗi xảy ra. Vui lòng thử lại sau.", 
            restaurants: [] 
        };
    }
};
export interface Restaurant {
  name: string;
  cuisine: string;
  rating: string;
  hours: string;
  note: string;
  mapsLink: string;
  signatureDish?: string;
  reviews?: string[];
  address?: string;
  menuImage?: string;
}

export interface Message {
  id: string;
  role: 'user' | 'model';
  text: string;
  restaurants?: Restaurant[];
}

export interface GroundingChunk {
  // FIX: The 'maps' property from the @google/genai library's GroundingChunk type is optional.
  // This has been updated to be optional to match the library's definition and fix the type error.
  maps?: {
    // FIX: The 'uri' property from the @google/genai library's GroundingChunk type is optional.
    // This has been updated to be optional to match the library's definition and fix the type error.
    uri?: string;
    // FIX: The 'title' property on 'maps' is optional in the library type. This is now optional to match.
    title?: string;
  };
}
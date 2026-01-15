import axios from "axios";

const GOOGLE_MAPS_API_KEY = process.env.GOOGLE_PLACES_API_KEY || "";

const client = axios.create({
    baseURL: "https://maps.googleapis.com/maps/api/place",
});

export interface GooglePlaceResult {
    place_id: string;
    name: string;
    formatted_address: string;
    rating?: number;
    user_ratings_total?: number;
    types: string[];
}

export const googleMaps = {
    /**
     * Search for businesses using Text Search
     */
    async textSearch(query: string, location?: string): Promise<GooglePlaceResult[]> {
        if (!GOOGLE_MAPS_API_KEY) {
            console.warn("GOOGLE_PLACES_API_KEY is not defined. Returning empty results.");
            return [];
        }

        try {
            const response = await client.get("/textsearch/json", {
                params: {
                    query,
                    location,
                    key: GOOGLE_MAPS_API_KEY,
                },
            });

            return response.data.results as GooglePlaceResult[];
        } catch (error) {
            console.error("Error in Google Text Search:", error);
            throw new Error("Failed to search businesses");
        }
    },

    /**
     * Get detailed info for a specific place
     */
    async getPlaceDetails(placeId: string) {
        if (!GOOGLE_MAPS_API_KEY) {
            throw new Error("GOOGLE_PLACES_API_KEY is not defined.");
        }

        try {
            const response = await client.get("/details/json", {
                params: {
                    place_id: placeId,
                    fields: "name,rating,user_ratings_total,reviews,formatted_address,types,editorial_summary,formatted_phone_number,website,opening_hours,photos",
                    key: GOOGLE_MAPS_API_KEY,
                },
            });

            return response.data.result;
        } catch (error) {
            console.error("Error in Google Place Details:", error);
            throw new Error("Failed to fetch business details");
        }
    },
};

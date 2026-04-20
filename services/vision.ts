import * as ImagePicker from "expo-image-picker";

/**
 * Extracted beer data from AI Vision analysis.
 */
export interface BeerExtraction {
  name: string;
  brewery: string | null;
  abv: number | null;
  confidence: number;
}

/**
 * Pick an image from camera or gallery.
 */
export async function pickImage(
  source: "camera" | "gallery"
): Promise<string | null> {
  if (source === "camera") {
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) return null;

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ["images"],
      quality: 0.8,
      base64: false,
    });

    if (result.canceled) return null;
    return result.assets[0]?.uri ?? null;
  }

  const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (!permission.granted) return null;

  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ["images"],
    quality: 0.8,
    base64: false,
  });

  if (result.canceled) return null;
  return result.assets[0]?.uri ?? null;
}

/**
 * Analyze a beer photo using OpenAI Vision API.
 *
 * NOTE: Requires OPENAI_API_KEY. If not set, returns mock data.
 * In production, this should call your own backend to keep the key secure.
 */
export async function analyzeBeerPhoto(
  imageUri: string,
  apiKey?: string
): Promise<BeerExtraction> {
  // If no API key, return intelligent mock data for development
  if (!apiKey) {
    return getMockExtraction();
  }

  try {
    // Convert image to base64 for the API
    const response = await fetch(imageUri);
    const blob = await response.blob();
    const base64 = await blobToBase64(blob);

    const apiResponse = await fetch(
      "https://api.openai.com/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "gpt-4o",
          messages: [
            {
              role: "system",
              content: `You are a beer identification expert. Analyze the image and extract beer information. Return ONLY valid JSON with these fields:
              {
                "name": "Beer Name",
                "brewery": "Brewery Name or null",
                "abv": 5.0 (number or null),
                "confidence": 0.85 (0-1 float)
              }
              Extract the name, brewery, and ABV exactly as found on the label or text. Ignore pricing.`,
            },
            {
              role: "user",
              content: [
                {
                  type: "text",
                  text: "What beer is this? Extract all details you can see.",
                },
                {
                  type: "image_url",
                  image_url: { url: `data:image/jpeg;base64,${base64}` },
                },
              ],
            },
          ],
          max_tokens: 300,
        }),
      }
    );

    const data = await apiResponse.json();
    const content = data.choices?.[0]?.message?.content || "";

    // Parse JSON from response
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]) as BeerExtraction;
    }

    return getMockExtraction();
  } catch (err) {
    console.error("AI analysis failed:", err);
    return getMockExtraction();
  }
}

function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      resolve(result.split(",")[1]);
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

/**
 * Mock extraction for development without API key.
 */
function getMockExtraction(): BeerExtraction {
  const mockBeers: BeerExtraction[] = [
    {
      name: "Punk IPA",
      brewery: "BrewDog",
      abv: 5.4,
      confidence: 0.92,
    },
    {
      name: "Neck Oil",
      brewery: "Beavertown",
      abv: 4.3,
      confidence: 0.88,
    },
    {
      name: "Hazy Jane",
      brewery: "BrewDog",
      abv: 5.0,
      confidence: 0.85,
    },
    {
      name: "Gamma Ray",
      brewery: "Beavertown",
      abv: 5.4,
      confidence: 0.9,
    },
    {
      name: "Pale Ale",
      brewery: "Camden Town",
      abv: 4.0,
      confidence: 0.87,
    },
  ];
  return mockBeers[Math.floor(Math.random() * mockBeers.length)];
}

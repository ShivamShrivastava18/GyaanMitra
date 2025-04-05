import { GoogleGenerativeAI } from "@google/generative-ai"

// Initialize the Gemini API with the hardcoded key
const API_KEY = "AIzaSyD8MlJZ8XOSGs2Tzz9aimj0vtgdfHyuuEc"
const genAI = new GoogleGenerativeAI(API_KEY)

// Check if the API is properly initialized
export function checkGeminiApiStatus() {
  try {
    return {
      initialized: !!genAI,
      keyAvailable: true,
    }
  } catch (error) {
    console.error("Error checking Gemini API status:", error)
    return {
      initialized: false,
      keyAvailable: false,
    }
  }
}

// Extract topics from curriculum content
export async function extractTopicsFromCurriculum(content: string, cacheKey = ""): Promise<string[]> {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-pro" })

    const prompt = `
      You are an educational content analyzer. Extract the main topics from the following curriculum content.
      Return ONLY a list of 5-10 distinct topics, with each topic being 2-5 words long.
      Format your response as a JSON array of strings, like this: ["Topic 1", "Topic 2", "Topic 3"]
      
      Content:
      ${content}
    `

    const result = await model.generateContent(prompt)
    const response = await result.response
    const text = response.text()

    // Extract JSON array from the response
    const jsonMatch = text.match(/\[.*\]/s)
    if (jsonMatch) {
      try {
        const topics = JSON.parse(jsonMatch[0])
        return Array.isArray(topics) ? topics : []
      } catch (e) {
        console.error("Error parsing JSON from Gemini response:", e)
        // Fallback: try to extract topics using regex
        const topicMatches = text.match(/"([^"]+)"/g)
        if (topicMatches) {
          return topicMatches.map((match) => match.replace(/"/g, ""))
        }
        return []
      }
    }

    // If no JSON array found, try to extract topics line by line
    const lines = text.split("\n")
    const topics = lines
      .map((line) => {
        // Remove numbers, bullets, etc.
        const cleaned = line.replace(/^[\d\s\-*•.]+/, "").trim()
        if (cleaned && cleaned.length > 0 && cleaned.length < 50) {
          return cleaned
        }
        return null
      })
      .filter(Boolean) as string[]

    return topics.slice(0, 10) // Limit to 10 topics
  } catch (error) {
    console.error("Error extracting topics:", error)
    return []
  }
}

// Extract topics from an image
export async function extractTopicsFromImage(imageBase64: string, cacheKey = ""): Promise<string[]> {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-pro" })

    // Create parts for multimodal input
    const imagePart = {
      inlineData: {
        data: imageBase64.replace(/^data:image\/\w+;base64,/, ""),
        mimeType: "image/jpeg",
      },
    }

    const prompt = `
      You are an educational content analyzer. Extract the main topics from the image of curriculum content.
      Return ONLY a list of 5-10 distinct topics, with each topic being 2-5 words long.
      Format your response as a JSON array of strings, like this: ["Topic 1", "Topic 2", "Topic 3"]
    `

    const result = await model.generateContent([prompt, imagePart])
    const response = await result.response
    const text = response.text()

    // Extract JSON array from the response
    const jsonMatch = text.match(/\[.*\]/s)
    if (jsonMatch) {
      try {
        const topics = JSON.parse(jsonMatch[0])
        return Array.isArray(topics) ? topics : []
      } catch (e) {
        console.error("Error parsing JSON from Gemini response:", e)
        // Fallback: try to extract topics using regex
        const topicMatches = text.match(/"([^"]+)"/g)
        if (topicMatches) {
          return topicMatches.map((match) => match.replace(/"/g, ""))
        }
        return []
      }
    }

    // If no JSON array found, try to extract topics line by line
    const lines = text.split("\n")
    const topics = lines
      .map((line) => {
        // Remove numbers, bullets, etc.
        const cleaned = line.replace(/^[\d\s\-*•.]+/, "").trim()
        if (cleaned && cleaned.length > 0 && cleaned.length < 50) {
          return cleaned
        }
        return null
      })
      .filter(Boolean) as string[]

    return topics.slice(0, 10) // Limit to 10 topics
  } catch (error) {
    console.error("Error extracting topics from image:", error)
    return []
  }
}

// Generate quiz questions
export async function generateQuiz(content: string, numQuestions = 5, language = "English"): Promise<any[]> {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-pro" })

    const prompt = `
      You are an educational quiz generator. Create ${numQuestions} multiple-choice questions based on the following content.
      Each question should have 4 options with exactly one correct answer.
      
      Content:
      ${content}
      
      Language: ${language}
      
      Format your response as a JSON array of objects, where each object has the following structure:
      {
        "question": "Question text",
        "options": ["Option A", "Option B", "Option C", "Option D"],
        "correctOptionIndex": 0, // Index of the correct option (0-3)
        "explanation": "Brief explanation of the correct answer"
      }
    `

    const result = await model.generateContent(prompt)
    const response = await result.response
    const text = response.text()

    // Extract JSON array from the response
    const jsonMatch = text.match(/\[.*\]/s)
    if (jsonMatch) {
      try {
        const questions = JSON.parse(jsonMatch[0])
        return Array.isArray(questions) ? questions : []
      } catch (e) {
        console.error("Error parsing JSON from Gemini response:", e)
        return []
      }
    }

    return []
  } catch (error) {
    console.error("Error generating quiz:", error)
    return []
  }
}


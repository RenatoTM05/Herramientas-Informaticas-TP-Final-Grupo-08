require('dotenv').config();
const { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } = require("@google/generative-ai");

const geminiService = {};

const getPrompt = (texto) => {
    return `Eres un moderador de reseñas de videojuegos.

Analiza la siguiente reseña.

Recházala si contiene:

- insultos
- discriminación
- spam
- publicidad
- links
- información personal
- amenazas
- contenido sexual
- lenguaje extremadamente ofensivo

Devuelve únicamente este JSON:

{
  "aprobada": true,
  "motivo": ""
}

o

{
  "aprobada": false,
  "motivo": "..."
}

Reseña:

"${texto}"`;
};

geminiService.validarResenaConGemini = async (texto) => {
    // para desactivar la moderacion durante el desarrollo/testing
    if (process.env.GEMINI_MODERACION === 'false') {
        console.log("INFO: La moderación de contenido con Gemini está desactivada por configuración.");
        return { aprobada: true, motivo: "Moderación desactivada para pruebas." };
    }

    try {
        if (!process.env.GEMINI_API_KEY) {
            // Para no bloquear el desarrollo si no hay key, aprobamos igual
            // En produccion, esto debería lanzar un error
            if (process.env.NODE_ENV === 'production') {
                throw new Error("La API Key de Gemini no está configurada en el servidor.");
            }
            console.warn("ADVERTENCIA: Moderación de contenido desactivada. No se encontró GEMINI_API_KEY.");
            return { aprobada: true, motivo: "Moderación automática desactivada (sin API Key)." };
        }

        const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

        // Se configuran las politicas de seguridad para que no bloqueen el prompt
        // El prompt contiene palabras como insulto,amenaza,etc y los filtros de seguridad por defecto de Google pueden bloquearlo
        const safetySettings = [
            { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_NONE },
            { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_NONE },
            { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_NONE },
            { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_NONE },
        ];

        const model = genAI.getGenerativeModel({
            model: "gemini-2.5-flash-lite", // Se actualiza al nombre del modelo 
            safetySettings,
            generationConfig: {
                // Asegura que la respuesta sea mas predecible y consistente
                temperature: 0.2,
                topK: 1,
                topP: 1,
                maxOutputTokens: 2048,
            },
        });

        const result = await model.generateContent(getPrompt(texto));
        const response = result.response;
        const textResponse = response.text().replace(/```json/g, '').replace(/```/g, '').trim();
        
        return JSON.parse(textResponse);

    } catch (error) {
        // Manejo de error especifico cuando la respuesta de Gemini es bloqueada por sus propios filtros de seguridad
        if (error.response && error.response.promptFeedback && error.response.promptFeedback.blockReason) {
            console.warn(`Advertencia de moderacion: La reseña fue bloqueada directamente por la API de Google. Razon: ${error.response.promptFeedback.blockReason}`);
            // En lugar de lanzar un error, devolvemos un objeto de validación 'no aprobada'.
            // Esto le da al frontend una respuesta clara de por que fue rechazada.
            return {
                aprobada: false,
                motivo: `Contenido rechazado automaticamente por politicas de seguridad. Razon: ${error.response.promptFeedback.blockReason}`
            };
        }

        console.error("Error al validar reseña con Gemini:", error);
        throw new Error("Fallo la comunicacion con el servicio de IA para moderacion.");
    }
};

module.exports = geminiService;
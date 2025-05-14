import embeddingModel  from "@/clients/embeddingModel";

export async function savePersonalInfoToVecDb(
    model: any,
    mobileNumber: string,
    personalInfo: {
        type: string;
        value: string;
        context: string;
    },
    index: any
) {
    try {
        const timestamp = new Date().toISOString();
        const metadata = {
            type: personalInfo.type,
            value: personalInfo.value,
            context: personalInfo.context,
            mobileNumber,
            timestamp,
            source: "user_input"
        };

        // Get embeddings for the personal info
        const embedding = await embeddingModel.embedQuery(personalInfo.value);
        
        // Store in Pinecone with a unique ID
        await index.upsert({
            vectors: [{
                id: `${mobileNumber}_${timestamp}`,
                values: embedding,
                metadata
            }]
        });

        console.log(`Stored personal info of type ${personalInfo.type} for ${mobileNumber}`);
    } catch (error) {
        console.error("Error storing personal information:", error);
        // Don't throw the error to prevent disrupting the main flow
    }
} 
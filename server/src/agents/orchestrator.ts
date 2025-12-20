import { runPerceptionAgent } from './PerceptionAgent';
import { runContextAgent } from './ContextAgent';
import { runLinguisticAgent } from './LinguisticAgent';

export const orchestrateTranslation = async (id: string, filePath: string, type: string) => {
    try {
        // 1. PERCEPTION: Audio/Video -> Text
        translationJobs.set(id, { status: 'processing', step: 'Perception Agent' });
        const perceptionData = await runPerceptionAgent(filePath);
        
        // 2. CONTEXT: Text -> Cultural Nuance (RAG)
        translationJobs.set(id, { ...translationJobs.get(id), step: 'Context Agent' });
        const contextData = await runContextAgent(perceptionData.text);

        // 3. LINGUISTIC: Text + Nuance -> Translation
        translationJobs.set(id, { ...translationJobs.get(id), step: 'Linguistic Agent' });
        const translation = await runLinguisticAgent(
            perceptionData.text, 
            contextData.culturalContext, 
            "English" // Or your desired target language
        );

        // 4. FINAL STATE
        translationJobs.set(id, { 
            status: 'completed', 
            step: 'Finished', 
            result: translation,
            culturalNotes: [contextData.culturalContext]
        });

    } catch (error) {
        console.error("Orchestration Error:", error);
        translationJobs.set(id, { status: 'failed', error: "The agents encountered a conflict." });
    }
};
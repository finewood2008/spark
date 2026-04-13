import { QeeClawBridge } from './src/backend/qeeclaw/qeeclaw-client';
import { AIProvider } from './src/backend/tools/AIProvider';

async function main() {
    console.log("Testing AIProvider integration with QeeClaw SDK...");
    try {
        await QeeClawBridge.init({
            baseUrl: 'http://localhost:3456',
            token: 'sk-0Q1Ei-n8o_e3bd9DApikwYKjaGU1C_Oz',
            teamId: 1
        });
        
        const provider = new AIProvider({
            baseUrl: '',
            apiKey: '',
            defaultModel: 'general-llm'
        });
        
        console.log("Calling provider.chat()...");
        const result = await provider.chat([
            { role: 'user', content: '测试一下AIProvider的集成' }
        ]);
        
        console.log("Result:", result);
    } catch (e) {
        console.error("Test Error:", e);
    }
}
main();

import { QeeClawBridge } from './src/backend/qeeclaw/qeeclaw-client';

async function main() {
    console.log("Testing QeeClaw SDK LLM endpoint to local mock...");
    try {
        const bridge = await QeeClawBridge.init({
            baseUrl: 'http://localhost:3456',
            token: 'sk-0Q1Ei-n8o_e3bd9DApikwYKjaGU1C_Oz',
            teamId: 1
        });
        
        console.log("Testing models.invoke()...");
        try {
            const result = await bridge.sdk.models.invoke({
                prompt: "你好，请自我介绍一下",
                messages: [
                    { role: "user", content: "你好，请自我介绍一下" }
                ],
                route: "general-llm", // Using mock's route
                stream: false
            });
            console.log("LLM SUCCESS:", result);
        } catch (e: any) {
            console.error("LLM FAILED:", e.response ? e.response.status : e.message);
        }
    } catch (e) {
        console.error("SDK Init Error:", e);
    }
}
main();

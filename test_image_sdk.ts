import { QeeClawBridge } from './src/backend/qeeclaw/qeeclaw-client';
import { ImageGenerator } from './src/backend/tools/ImageGenerator';

async function main() {
    console.log("Testing ImageGenerator SDK fallback...");
    try {
        await QeeClawBridge.init({
            baseUrl: 'http://localhost:3456',
            token: 'sk-0Q1Ei-n8o_e3bd9DApikwYKjaGU1C_Oz',
            teamId: 1
        });
        
        const generator = new ImageGenerator();
        
        console.log("Calling generateIllustration()...");
        try {
            const result = await generator.generateIllustration('测试星空封面图');
            console.log("Result SUCCESS:", result);
        } catch (e: any) {
            console.error("Result FAILED (Expected if CF proxy key not set):", e.message);
        }
    } catch (e) {
        console.error("Test Error:", e);
    }
}
main();

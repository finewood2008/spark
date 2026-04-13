import { QeeClawBridge } from './src/backend/qeeclaw/qeeclaw-client';

async function main() {
    console.log("Testing specific QeeClaw SDK endpoints...");
    try {
        const bridge = await QeeClawBridge.init({
            baseUrl: 'https://api.qeeclaw.com',
            token: 'sk-0Q1Ei-n8o_e3bd9DApikwYKjaGU1C_Oz',
            teamId: 0
        });
        
        console.log("Testing iam.getProfile()...");
        try {
            const profile = await bridge.sdk.iam.getProfile();
            console.log("Profile SUCCESS:", profile);
        } catch (e: any) {
            console.error("Profile FAILED:", e.response ? e.response.status : e.message);
        }
        
        console.log("Testing models.listAvailable()...");
        try {
            const models = await bridge.sdk.models.listAvailable();
            console.log("Models SUCCESS:", models ? models.length : 0, "models");
        } catch (e: any) {
            console.error("Models FAILED:", e.response ? e.response.status : e.message);
        }
    } catch (e) {
        console.error("SDK Init Error:", e);
    }
}
main();

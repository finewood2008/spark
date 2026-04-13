import { QeeClawBridge } from './src/backend/qeeclaw/qeeclaw-client';

async function main() {
    console.log("Testing specific QeeClaw SDK endpoints to local mock...");
    try {
        const bridge = await QeeClawBridge.init({
            baseUrl: 'http://localhost:3456',
            token: 'sk-0Q1Ei-n8o_e3bd9DApikwYKjaGU1C_Oz',
            teamId: 1
        });
        
        console.log("Testing iam.getProfile()...");
        try {
            const profile = await bridge.sdk.iam.getProfile();
            console.log("Profile SUCCESS:", profile);
        } catch (e: any) {
            console.error("Profile FAILED:", e.response ? e.response.status : e.message);
        }
    } catch (e) {
        console.error("SDK Init Error:", e);
    }
}
main();

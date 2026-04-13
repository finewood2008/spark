import { QeeClawBridge } from './src/backend/qeeclaw/qeeclaw-client';

async function main() {
    console.log("Testing QeeClaw SDK connection...");
    
    // Default URL from agent-ipc.ts is https://api.qeeclaw.com
    // Let's test with the provided key and teamId 0 or 1 to see if it pings successfully.
    try {
        const bridge = await QeeClawBridge.init({
            baseUrl: 'https://api.qeeclaw.com',
            token: 'sk-0Q1Ei-n8o_e3bd9DApikwYKjaGU1C_Oz',
            teamId: 1 // dummy for now, let's see if ping needs it
        });
        
        const online = await bridge.ping();
        console.log("Ping result:", online);
        
        if (online) {
            const profile = await bridge.iam.getProfile().catch(e => e.message);
            console.log("Profile:", profile);
        }
    } catch (e) {
        console.error("Error:", e);
    }
}
main();

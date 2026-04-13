import { QeeClawBridge } from './src/backend/qeeclaw/qeeclaw-client';

async function main() {
    console.log("Testing QeeClaw SDK connection with new key...");
    try {
        const bridge = await QeeClawBridge.init({
            baseUrl: 'https://api.qeeclaw.com',
            token: 'sk-0Q1Ei-n8o_e3bd9DApikwYKjaGU1C_Oz',
            teamId: 0
        });
        
        console.log("Bridge init completed. About to ping...");
        const online = await bridge.ping();
        console.log("Ping result:", online);
        
        if (online) {
            console.log("Fetching profile...");
            const profile = await bridge.iam.getProfile();
            console.log("Profile:", profile);
        } else {
            console.log("Ping failed. Bridge might be initializing but online status is false.");
        }
    } catch (e) {
        console.error("SDK Error:", e);
    }
}
main();

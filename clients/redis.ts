import Redis from "ioredis";

const redis = new Redis(process.env.REDIS_URL || "redis://localhost:6379"); 

export default redis



// import { createClient, RedisClientType } from 'redis';

// export interface CampaignVariables {
//   campaignName: string;
//   campaignType: string;
//   overrideCompany: string;
//   personaName: string;
//   jobRole: string;
//   campaignObjective: string;
//   communicationStyles: string;
//   initialMessage: string;
//   followUpMessage: string;
// }

// const client = createClient({
//     url: process.env.REDIS_URL || 'redis://localhost:6379'
//   });

// client.on('connect', () => {
//   console.log('Connected to Redis');
// });

// client.on('error', (err) => {
//   console.error('Redis error:', err);
// });

// let connectionPromise: Promise<void> | null = null;

// export async function connectToRedis() {
//     if (!connectionPromise) {
//       connectionPromise = client.connect();
//     }
//     return connectionPromise;
//   }
  
// export async function disconnectFromRedis() {
//     await client.disconnect();
//     connectionPromise = null;
// }

// export async function getOrSetCache(key: string, data: CampaignVariables): Promise<CampaignVariables> {
//     await connectToRedis();

//     const result = await client.get(key);

//     if (result) {
//         return JSON.parse(result) as CampaignVariables;
//     } else {
//     await client.setEx(key, 7200, JSON.stringify(data));
//     return data;
//     }
// }

// export default client;
  
// const data: CampaignVariables = {
//     campaignName: 'Summer Sale',
//     campaignType: 'Promotional',
//     overrideCompany: 'Acme Corp',
//     personaName: 'John Doe',
//     jobRole: 'Marketing Manager',
//     campaignObjective: 'Increase sales',
//     communicationStyles: 'Friendly',
//     initialMessage: 'Hi there!',
//     followUpMessage: "Don't forget our sale!",
// };
  
// async function main() {
//     await client.connect();

//     try {
//         const result = await getOrSetCache('campaign:123', data);
//         console.log(result);
//     } catch (err) {
//         console.error(err);
//     } finally {
//         await client.disconnect();
//     }
// }

// main()


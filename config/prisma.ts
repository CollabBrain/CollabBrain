import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import 'dotenv/config';

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });
prisma.$connect()
  .then(() => console.log("Connnect Database successfull!"))
  .catch(() => console.log("Connect Database fail"))
export default prisma;
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import pg from 'pg';
import 'dotenv/config';

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL! });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });
prisma.$connect()
  .then(() => console.log("Connnect Database successfull!"))
  .catch(() => console.log("Connect Database fail"))
export default prisma;
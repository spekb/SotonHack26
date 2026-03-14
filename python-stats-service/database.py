from motor.motor_asyncio import AsyncIOMotorClient, AsyncIOMotorDatabase
import os
from dotenv import load_dotenv

load_dotenv()

client: AsyncIOMotorClient = AsyncIOMotorClient(
    os.getenv("MONGODB_URI"),
    tlsAllowInvalidCertificates=True
)
db: AsyncIOMotorDatabase = client.sotonhack
'use server';

import mongoose from 'mongoose';
import { connectDB } from '../mongoose'; // Ensure mongoose is connected

export type Conversation = {
    id: string;
    vocab : string[];
    new_vocab: string[][];
    participants: {name: string, id: string}[];
    topics: string[];
    dateStamp : Date;
    length: number;
};

export type User = {
    name: string;
    id: string;
    total_time: number;
    conversations: Conversation[];
    vocab: string[];
    native_lang: string;
    learning_langs: string[];
    skill_level: number;
};

// Define Mongoose Schema & Models
const ConversationSchema = new mongoose.Schema({
    id: { type: String, required: true, unique: true },
    vocab: [String],
    new_vocab: [[String]],
    participants: [{ name: String, id: String }],
    topics: [String],
    dateStamp: Date,
    length: Number
});

const UserSchema = new mongoose.Schema({
    id: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    total_time: Number,
    conversations: [ConversationSchema],
    vocab: [String],
    native_lang: String,
    learning_langs: [String],
    skill_level: Number,
});

// Avoid OverwriteModelError
const ConversationModel = mongoose.models.Conversation || mongoose.model('Conversation', ConversationSchema);
const UserModel = mongoose.models.User || mongoose.model('User', UserSchema);

export async function getUserById(id: string): Promise<User | null> {
    try {
        await connectDB();
        const user = await UserModel.findOne({ id }).lean();
        if (!user) return null;
        
        return {
            id: user.id,
            name: user.name,
            total_time: user.total_time as number,
            conversations: (user.conversations as any[]).map(conv => ({
                id: conv.id,
                vocab: conv.vocab,
                new_vocab: conv.new_vocab,
                participants: conv.participants,
                topics: conv.topics,
                dateStamp: conv.dateStamp,
                length: conv.length
            })),
            vocab: user.vocab as string[],
            native_lang: user.native_lang,
            learning_langs: user.learning_langs as string[],
            skill_level: user.skill_level as number
        };
    } catch (error) {
        console.error("Error fetching user by ID:", error);
        return null;
    }
}

export async function getUserByName(name: string): Promise<User | null> {
    try {
        await connectDB();
        const user = await UserModel.findOne({ name }).lean();
        if (!user) return null;

        return {
            id: user.id,
            name: user.name,
            total_time: user.total_time as number,
            conversations: (user.conversations as any[]).map(conv => ({
                id: conv.id,
                vocab: conv.vocab,
                new_vocab: conv.new_vocab,
                participants: conv.participants,
                topics: conv.topics,
                dateStamp: conv.dateStamp,
                length: conv.length
            })),
            vocab: user.vocab as string[],
            native_lang: user.native_lang,
            learning_langs: user.learning_langs as string[],
            skill_level: user.skill_level as number
        };
    } catch (error) {
        console.error("Error fetching user by name:", error);
        return null;
    }
}

export async function getConversationById(id: string): Promise<Conversation | null> {
    try {
        await connectDB();
        const conversation = await ConversationModel.findOne({ id }).lean();
        if (!conversation) return null;

        return {
            id: conversation.id,
            vocab: conversation.vocab as string[],
            new_vocab: conversation.new_vocab as string[][],
            participants: (conversation.participants as any[]).map(p => ({
                name: p.name,
                id: p.id
            })),
            topics: conversation.topics as string[],
            dateStamp: conversation.dateStamp as Date,
            length: conversation.length as number
        };
    } catch (error) {
        console.error("Error fetching conversation by ID:", error);
        return null;
    }
}

export async function insertUserByDetails(name: string, native_lang: string, learning_langs: string[], skill_level: number): Promise<User | null> {
    try {
        await connectDB();
        const id = new mongoose.Types.ObjectId().toString();
        const newUser = new UserModel({
            id,
            name,
            total_time: 0,
            conversations: [],
            vocab: [],
            native_lang: native_lang,
            learning_langs: learning_langs,
            skill_level: skill_level
        });
        
        await newUser.save();

        return {
            id: newUser.id,
            name: newUser.name,
            total_time: newUser.total_time as number,
            conversations: [],
            vocab: [],
            native_lang: newUser.native_lang,
            learning_langs: newUser.learning_langs as string[],
            skill_level: newUser.skill_level as number
        };
    } catch (error) {
        console.error("Error inserting user:", error);
        return null;
    }
}

export async function insertConversation(data: Omit<Conversation, 'id'>): Promise<Conversation | null> {
    try {
        await connectDB();
        const id = new mongoose.Types.ObjectId().toString();
        const newConversation = new ConversationModel({
            id,
            vocab: data.vocab,
            new_vocab: data.new_vocab,
            participants: data.participants,
            topics: data.topics,
            dateStamp: data.dateStamp,
            length: data.length
        });
        
        await newConversation.save();

        const savedConv: Conversation = {
            id: newConversation.id,
            vocab: newConversation.vocab as string[],
            new_vocab: newConversation.new_vocab as string[][],
            participants: (newConversation.participants as any[]).map(p => ({
                name: p.name,
                id: p.id
            })),
            topics: newConversation.topics as string[],
            dateStamp: newConversation.dateStamp as Date,
            length: newConversation.length as number
        };

        // Add the conversation to the conversations array of each participant
        const participantIds = data.participants.map(p => p.id);
        if (participantIds.length > 0) {
            await UserModel.updateMany(
                { id: { $in: participantIds } },
                { $push: { conversations: newConversation } }
            );
        }

        return savedConv;
    } catch (error) {
        console.error("Error inserting conversation:", error);
        return null;
    }
}

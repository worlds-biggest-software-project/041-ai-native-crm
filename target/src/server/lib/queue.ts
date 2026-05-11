import { Queue } from "bullmq";
import { redis } from "./redis";

const connection = redis;

export const emailSyncQueue = new Queue("email-sync", { connection });
export const calendarSyncQueue = new Queue("calendar-sync", { connection });
export const aiJobsQueue = new Queue("ai-jobs", { connection });
export const scoringQueue = new Queue("scoring", { connection });
export const enrichmentQueue = new Queue("enrichment", { connection });
export const webhookDispatchQueue = new Queue("webhook-dispatch", { connection });

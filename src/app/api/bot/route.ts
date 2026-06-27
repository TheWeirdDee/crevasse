import { webhookCallback } from 'grammy';
import { bot } from '../../../bot';

export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';

export const POST = webhookCallback(bot, 'std/http');

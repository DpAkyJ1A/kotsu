'use server';

import { defineAction } from '@/server/actions';

import { saveDoc } from './domain/commands';

export const saveDocAction = defineAction(saveDoc);

'use server';

import { defineAction } from '@/server/actions';

import { completeOnboarding } from './domain/commands';

export const completeOnboardingAction = defineAction(completeOnboarding);

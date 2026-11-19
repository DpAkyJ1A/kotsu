'use server';

import { defineAction } from '@/server/actions';

import {
  createShelf,
  deleteShelf,
  moveShelf,
  updateShelf,
} from './domain/commands';

export const createShelfAction = defineAction(createShelf);

export const updateShelfAction = defineAction(updateShelf);

export const moveShelfAction = defineAction(moveShelf);

export const deleteShelfAction = defineAction(deleteShelf);

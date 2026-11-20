'use server';

import { defineAction } from '@/server/actions';

import {
  createShelf,
  deleteShelf,
  moveShelf,
  updateShelf,
} from './domain/commands';
import {
  createItem,
  deleteItem,
  moveItem,
  renameItem,
} from './domain/item-commands';

export const createShelfAction = defineAction(createShelf);

export const updateShelfAction = defineAction(updateShelf);

export const moveShelfAction = defineAction(moveShelf);

export const deleteShelfAction = defineAction(deleteShelf);

export const createItemAction = defineAction(createItem);

export const renameItemAction = defineAction(renameItem);

export const moveItemAction = defineAction(moveItem);

export const deleteItemAction = defineAction(deleteItem);

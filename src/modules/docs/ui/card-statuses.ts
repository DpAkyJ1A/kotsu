import { createContext } from 'react';

import type { CardStatuses } from '../core/card-status';

export const CardStatusesContext = createContext<CardStatuses>({});

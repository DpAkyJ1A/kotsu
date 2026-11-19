export const TEMPLATE_IDS = [
  'language',
  'course',
  'jobSearch',
  'blank',
] as const;

export type TemplateId = (typeof TEMPLATE_IDS)[number];

export type Template = { shelves: readonly string[] };

export type Templates = Record<TemplateId, Template>;

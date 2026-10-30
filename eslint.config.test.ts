import { readdirSync } from 'node:fs';

import { describe, expect, test } from 'vitest';

import { MODULE_DEPENDENCIES } from './eslint.config';

type Graph = Record<string, readonly string[]>;

// Depth-first search; returns the first cycle as a path, e.g. ['a', 'b', 'a'].
function findCycle(graph: Graph): string[] | undefined {
  const done = new Set<string>();

  function visit(node: string, path: string[]): string[] | undefined {
    if (path.includes(node)) return [...path.slice(path.indexOf(node)), node];
    if (done.has(node)) return undefined;
    for (const next of graph[node] ?? []) {
      const cycle = visit(next, [...path, node]);
      if (cycle) return cycle;
    }
    done.add(node);
    return undefined;
  }

  for (const node of Object.keys(graph)) {
    const cycle = visit(node, []);
    if (cycle) return cycle;
  }
  return undefined;
}

describe('findCycle', () => {
  test('finds a cycle', () => {
    expect(findCycle({ a: ['b'], b: ['c'], c: ['a'] })).toEqual([
      'a',
      'b',
      'c',
      'a',
    ]);
  });

  test('accepts a graph without cycles', () => {
    expect(findCycle({ a: ['b', 'c'], b: ['c'], c: [] })).toBeUndefined();
  });
});

describe('module graph', () => {
  const modules = Object.keys(MODULE_DEPENDENCIES);

  test('lists exactly the folders in src/modules', () => {
    const folders = readdirSync(new URL('src/modules', import.meta.url), {
      withFileTypes: true,
    })
      .filter((entry) => entry.isDirectory())
      .map((entry) => entry.name);

    expect(modules.toSorted()).toEqual(folders.toSorted());
  });

  test('depends only on listed modules', () => {
    const unknown = Object.values(MODULE_DEPENDENCIES)
      .flat()
      .filter((dependency) => !modules.includes(dependency));

    expect(unknown).toEqual([]);
  });

  test('has no cycles', () => {
    expect(findCycle(MODULE_DEPENDENCIES)).toBeUndefined();
  });
});

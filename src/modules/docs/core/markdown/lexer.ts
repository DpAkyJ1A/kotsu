import { Marked, type MarkedToken, type Token } from 'marked';

const markdown = new Marked({
  gfm: true,
  tokenizer: { url: () => undefined },
});

export function lexBlocks(source: string): MarkedToken[] {
  return asMarkedTokens(markdown.lexer(source));
}

export function lexInline(source: string): MarkedToken[] {
  return asMarkedTokens(markdown.Lexer.lexInline(source, markdown.defaults));
}

export function asMarkedTokens(tokens: Token[] = []): MarkedToken[] {
  return tokens as MarkedToken[];
}

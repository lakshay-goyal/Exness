export function getDocsUrl(): string {
  return process.env.NEXT_PUBLIC_DOCS_URL ?? 'http://localhost:3000';
}

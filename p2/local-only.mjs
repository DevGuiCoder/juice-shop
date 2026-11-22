export const baseUrl = process.env.P2_BASE_URL || 'http://127.0.0.1:3000'
const parsed = new URL(baseUrl)
if (!['127.0.0.1', 'localhost', '[::1]'].includes(parsed.hostname) || parsed.protocol !== 'http:') {
  throw new Error('Os testes P2 aceitam somente HTTP em loopback.')
}

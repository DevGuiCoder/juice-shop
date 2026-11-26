import { writeFileSync } from 'node:fs'
const items = []
function request (name, method, path, body, tests) {
  items.push({ name, request: { method, header: [{ key: 'Content-Type', value: 'application/json' }, ...(path.toLowerCase().includes('basket') ? [{ key: 'Authorization', value: 'Bearer {{token}}' }] : [])], url: '{{baseUrl}}' + path, ...(body ? { body: { mode: 'raw', raw: JSON.stringify(body) } } : {}) }, event: [{ listen: 'test', script: { type: 'text/javascript', exec: tests } }] })
}
request('API-01 RF-01 Cadastro válido', 'POST', '/api/Users', { email: '{{email}}', password: '{{password}}', passwordRepeat: '{{password}}' }, [
  "pm.test('201 e conta persistida', () => { pm.response.to.have.status(201); const j=pm.response.json(); pm.expect(j.data.id).to.be.a('number'); pm.expect(j.data.email).to.eql(pm.environment.get('email')); });"
])
request('API-02 RF-02 Login válido', 'POST', '/rest/user/login', { email: '{{email}}', password: '{{password}}' }, [
  "pm.test('200, token e carrinho', () => { pm.response.to.have.status(200); const a=pm.response.json().authentication; pm.expect(a.token).to.be.a('string').and.not.empty; pm.expect(a.bid).to.be.a('number'); pm.expect(a.umail).to.eql(pm.environment.get('email')); pm.environment.set('token',a.token); pm.environment.set('basketId',a.bid); });"
])
request('API-03 RF-02 Senha inválida', 'POST', '/rest/user/login', { email: '{{email}}', password: 'Incorreta123!' }, [
  "pm.test('401 e mensagem sem token', () => { pm.response.to.have.status(401); pm.expect(pm.response.text()).not.to.be.empty; pm.expect(pm.response.text()).not.to.include('authentication'); });"
])
request('API-04 RF-03 Busca válida', 'GET', '/rest/products/search?q=Apple', null, [
  "pm.test('200 e produtos compatíveis', () => { pm.response.to.have.status(200); const d=pm.response.json().data; pm.expect(d).to.be.an('array').and.not.empty; d.forEach(p=>{pm.expect(p.id).to.be.a('number');pm.expect(p.price).to.be.a('number');pm.expect((p.name+' '+p.description).toLowerCase()).to.include('apple');}); });"
])
request('API-05 RF-03 Busca inexistente', 'GET', '/rest/products/search?q=p2inexistente987654321', null, [
  "pm.test('200 e lista vazia', () => { pm.response.to.have.status(200); pm.expect(pm.response.json().data).to.eql([]); });"
])
request('API-06 RF-05 Carrinho próprio', 'GET', '/rest/basket/{{basketId}}', null, [
  "pm.test('200 e carrinho da sessão', () => { pm.response.to.have.status(200); const d=pm.response.json().data; pm.expect(d.id).to.eql(Number(pm.environment.get('basketId'))); pm.expect(d.Products).to.be.an('array'); });"
])
request('API-08 RF-05 Adicionar item ao carrinho', 'POST', '/api/BasketItems', { ProductId: 1, BasketId: '{{basketId}}', quantity: 1 }, [
  "pm.test('200 e item vinculado ao carrinho', () => { pm.response.to.have.status(200); const d=pm.response.json().data; pm.expect(d.ProductId).to.eql(1); pm.expect(Number(d.BasketId)).to.eql(Number(pm.environment.get('basketId'))); pm.expect(d.quantity).to.eql(1); pm.environment.set('basketItemId', d.id); });"
])
request('API-09 RF-06 Remover item do carrinho', 'DELETE', '/api/BasketItems/{{basketItemId}}', null, [
  "pm.test('200 na remoção', () => { pm.response.to.have.status(200); pm.expect(pm.response.json().status).to.eql('success'); });"
])
request('API-10 RF-06 Carrinho sem o item removido', 'GET', '/rest/basket/{{basketId}}', null, [
  "pm.test('item removido não aparece', () => { pm.response.to.have.status(200); const ids=pm.response.json().data.Products.map(p=>p.BasketItem.id); pm.expect(ids).to.not.include(Number(pm.environment.get('basketItemId'))); });"
])
request('API-07 RF-01 Cadastro duplicado', 'POST', '/api/Users', { email: '{{email}}', password: '{{password}}' }, [
  "pm.test('400 e erro de unicidade', () => { pm.response.to.have.status(400); const j=pm.response.json(); pm.expect(j.errors).to.be.an('array').and.not.empty; pm.expect(JSON.stringify(j.errors).toLowerCase()).to.include('unique'); });"
])
writeFileSync('postman.collection.json', JSON.stringify({ info: { name: 'P2 Juice Shop local', schema: 'https://schema.getpostman.com/json/collection/v2.1.0/collection.json' }, event: [{ listen: 'prerequest', script: { type: 'text/javascript', exec: ["if (!['http://127.0.0.1:3000','http://localhost:3000','http://[::1]:3000'].includes(pm.environment.get('baseUrl'))) throw new Error('Somente loopback na porta 3000');", "if (pm.info.requestName.startsWith('API-01')) pm.environment.set('email','p2.api.'+Date.now()+'@example.test');"] } }], item: items }, null, 2))
writeFileSync('postman.environment.json', JSON.stringify({ name: 'P2 local', values: [{ key: 'baseUrl', value: 'http://127.0.0.1:3000', enabled: true }, { key: 'email', value: '', enabled: true }, { key: 'password', value: 'P2teste123!', enabled: true }, { key: 'token', value: '', enabled: true }, { key: 'basketId', value: '', enabled: true }, { key: 'basketItemId', value: '', enabled: true }], _postman_variable_scope: 'environment' }, null, 2))

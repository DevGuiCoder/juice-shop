import { test } from 'node:test'
import assert from 'node:assert/strict'
import { mkdir, writeFile } from 'node:fs/promises'
import { Builder, By, Key, until } from 'selenium-webdriver'
import chrome from 'selenium-webdriver/chrome.js'
import { baseUrl } from './local-only.mjs'

const password = 'P2teste123!'
const locate = async (driver, selector) => driver.wait(until.elementLocated(By.css(selector)), 15000)
async function click (driver, selector) {
  const element = await locate(driver, selector)
  await driver.wait(until.elementIsVisible(element), 10000)
  await driver.wait(until.elementIsEnabled(element), 10000)
  await driver.executeScript('arguments[0].scrollIntoView({block:"center"})', element)
  await driver.wait(async () => driver.executeScript('const r=arguments[0].getBoundingClientRect(); const hit=document.elementFromPoint(r.x+r.width/2,r.y+r.height/2); return hit && arguments[0].contains(hit)', element), 10000)
  await element.click()
}
async function createAccount () {
  const email = `p2.ui.${Date.now()}.${Math.floor(Math.random() * 10000)}@example.test`
  const response = await fetch(baseUrl + '/api/Users', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email, password, passwordRepeat: password }) })
  assert.equal(response.status, 201)
  return email
}
async function login (driver, email) {
  await driver.get(baseUrl + '/#/login')
  await (await locate(driver, '#email')).sendKeys(email)
  await (await locate(driver, '#password')).sendKeys(password)
  await click(driver, '#loginButton')
  await driver.wait(async () => Boolean(await driver.executeScript('return localStorage.getItem("token")')), 15000)
  await driver.wait(until.urlContains('/search'), 15000)
}
async function scenario (id, body) {
  let driver
  const startedAt = new Date().toISOString()
  await mkdir('evidence', { recursive: true })
  try {
    const options = new chrome.Options().addArguments('--headless=new', '--window-size=1366,900', '--disable-search-engine-choice-screen')
    if (process.env.CHROME_BINARY) options.setChromeBinaryPath(process.env.CHROME_BINARY)
    driver = await new Builder().forBrowser('chrome').setChromeOptions(options).build()
    await driver.get(baseUrl)
    await driver.manage().addCookie({ name: 'welcomebanner_status', value: 'dismiss', path: '/' })
    await driver.manage().addCookie({ name: 'cookieconsent_status', value: 'dismiss', path: '/' })
    await driver.manage().addCookie({ name: 'language', value: 'en', path: '/' })
    await driver.navigate().refresh()
    await body(driver)
    await writeFile(`evidence/${id}.png`, await driver.takeScreenshot(), 'base64')
    await writeFile(`evidence/${id}.json`, JSON.stringify({ id, startedAt, endedAt: new Date().toISOString(), status: 'Aprovado', browser: await driver.getCapabilities().then(c => ({ name: c.get('browserName'), version: c.get('browserVersion') })) }, null, 2))
  } catch (error) {
    if (driver) await writeFile(`evidence/${id}-failure.png`, await driver.takeScreenshot(), 'base64').catch(() => {})
    await writeFile(`evidence/${id}.json`, JSON.stringify({ id, startedAt, status: 'Reprovado', error: error.stack }, null, 2))
    throw error
  } finally {
    if (driver) await driver.quit()
  }
}
test('UI-01 CT-01 cadastro pela interface', () => scenario('UI-01', async driver => {
  const email = `p2.register.${Date.now()}@example.test`
  await driver.get(baseUrl + '/#/register')
  await (await locate(driver, '#emailControl')).sendKeys(email)
  await (await locate(driver, '#passwordControl')).sendKeys(password)
  await (await locate(driver, '#repeatPasswordControl')).sendKeys(password)
  const counter = `${password.length}/40`
  await driver.wait(async () => (await driver.executeScript('return document.body.innerText')).includes(counter), 15000)
  assert.ok((await driver.executeScript('return document.body.innerText')).includes(counter), `Contador ${counter} não exibido`)
  await writeFile('evidence/DEF-002-retest.png', await driver.takeScreenshot(), 'base64')
  await (await locate(driver, 'mat-select[name="securityQuestion"]')).sendKeys(Key.SPACE)
  await click(driver, 'mat-option')
  await (await locate(driver, '#securityAnswerControl')).sendKeys('Azul')
  await click(driver, '#registerButton')
  await driver.wait(until.urlContains('/login'), 15000)
  await login(driver, email)
  assert.ok(await driver.executeScript('return localStorage.getItem("token")'))
}))
test('UI-02 CT-10 login da conta própria', () => scenario('UI-02', async driver => {
  await login(driver, await createAccount())
  await click(driver, '#navbarAccount')
  const logout = await locate(driver, '#navbarLogoutButton')
  await driver.wait(until.elementIsVisible(logout), 10000)
  assert.ok(await logout.isDisplayed())
}))
test('UI-03 CT-14 pesquisa por produto', () => scenario('UI-03', async driver => {
  await click(driver, '#searchQuery')
  await (await locate(driver, '#searchQuery input')).sendKeys('Apple', Key.ENTER)
  await driver.wait(until.elementLocated(By.css('app-product')), 15000)
  const text = await (await locate(driver, '.products-grid')).getText()
  assert.match(text, /Apple/i)
  assert.equal(await (await locate(driver, '#searchValue')).getText(), 'Apple')
}))
test('UI-04 CT-20 adicionar ao carrinho', () => scenario('UI-04', async driver => {
  await login(driver, await createAccount())
  await driver.get(baseUrl + '/#/search?q=Apple')
  const card = await locate(driver, 'app-product')
  const name = await card.findElement(By.css('.name')).getText()
  await card.findElement(By.css('button[aria-label="Add to Basket"]')).click()
  await driver.wait(until.elementLocated(By.css('.mat-mdc-snack-bar-label')), 10000)
  await driver.get(baseUrl + '/#/basket')
  await driver.wait(async () => (await (await locate(driver, 'app-basket')).getText()).includes(name), 15000)
  assert.match(await (await locate(driver, 'app-basket')).getText(), new RegExp(name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')))
}))
test('UI-05 CT-23 remover item do carrinho', () => scenario('UI-05', async driver => {
  await login(driver, await createAccount())
  await driver.get(baseUrl + '/#/search?q=Apple')
  const card = await locate(driver, 'app-product')
  const name = await card.findElement(By.css('.name')).getText()
  await card.findElement(By.css('button[aria-label="Add to Basket"]')).click()
  await driver.wait(until.elementLocated(By.css('.mat-mdc-snack-bar-label')), 10000)
  await driver.get(baseUrl + '/#/basket')
  await driver.wait(async () => (await (await locate(driver, 'app-basket')).getText()).includes(name), 15000)
  await click(driver, 'mat-row button:has(.fa-trash-alt)')
  await driver.wait(async () => !(await (await locate(driver, 'app-basket')).getText()).includes(name), 15000)
  assert.doesNotMatch(await (await locate(driver, 'app-basket')).getText(), new RegExp(name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')))
}))

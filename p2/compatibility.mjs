import { Builder, By, until } from 'selenium-webdriver'
import chrome from 'selenium-webdriver/chrome.js'
import assert from 'node:assert/strict'
import { mkdir, writeFile } from 'node:fs/promises'
import { baseUrl } from './local-only.mjs'

await mkdir('evidence', { recursive: true })
for (const [id, width, height] of [['NF-03',1366,768],['NF-04',390,844]]) {
  let driver
  const result = { id, width, height, startedAt: new Date().toISOString(), status: 'Bloqueado' }
  try {
    driver=await new Builder().forBrowser('chrome').setChromeOptions(new chrome.Options().addArguments('--headless=new', `--window-size=${width},${height}`)).build()
    await driver.manage().window().setRect({ width, height })
    await driver.get(baseUrl)
    await driver.manage().addCookie({name:'welcomebanner_status',value:'dismiss',path:'/'})
    await driver.manage().addCookie({name:'cookieconsent_status',value:'dismiss',path:'/'})
    await driver.manage().addCookie({name:'language',value:'en',path:'/'})
    await driver.navigate().refresh()
    await driver.get(baseUrl+'/#/search?q=Apple')
    const product=await driver.wait(until.elementLocated(By.css('app-product')),15000)
    assert.match(await product.getText(),/Apple/i)
    await writeFile(`evidence/${id}-search.png`,await driver.takeScreenshot(),'base64')
    const email=`p2.compat.${Date.now()}@example.test`, password='P2teste123!'
    const response=await fetch(baseUrl+'/api/Users',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({email,password})})
    assert.equal(response.status,201)
    await driver.get(baseUrl+'/#/login')
    await (await driver.wait(until.elementLocated(By.id('email')),15000)).sendKeys(email)
    await driver.findElement(By.id('password')).sendKeys(password)
    const button=await driver.findElement(By.id('loginButton'))
    await driver.executeScript('arguments[0].scrollIntoView({block:"center"})',button)
    assert.ok(await button.isDisplayed())
    const rect=await button.getRect()
    const viewport=await driver.executeScript('return {width:innerWidth,height:innerHeight}')
    assert.ok(rect.width<=viewport.width, 'Botão não cabe na largura disponível')
    await button.click()
    await driver.wait(async()=>Boolean(await driver.executeScript('return localStorage.getItem("token")')),15000)
    await writeFile(`evidence/${id}-login.png`,await driver.takeScreenshot(),'base64')
    result.status='Aprovado'
    result.observed='Busca encontrou Apple e login concluiu; controles utilizados sem obstrução.'
    result.viewport=viewport
    result.browserVersion=(await driver.getCapabilities()).get('browserVersion')
  } catch(error) {
    result.status=driver?'Reprovado':'Bloqueado'
    result.error=error.stack
    if(driver) await writeFile(`evidence/${id}-failure.png`,await driver.takeScreenshot(),'base64').catch(()=>{})
    process.exitCode=1
  } finally {
    result.endedAt=new Date().toISOString()
    await writeFile(`evidence/${id}.json`,JSON.stringify(result,null,2))
    if(driver)await driver.quit()
    console.log(result.id,result.status)
  }
}

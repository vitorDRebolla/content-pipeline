import { scrapeUrl, ScrapingError } from '../services/scraper'

describe('scrapeUrl SSRF protection', () => {
  const blockedUrls = [
    'http://localhost/admin',
    'http://127.0.0.1/secret',
    'http://127.0.0.2/anything',
    'http://0.0.0.0/',
    'http://169.254.169.254/latest/meta-data',
    'http://10.0.0.1/',
    'http://192.168.1.100/router',
    'http://172.16.0.1/',
    'http://172.31.255.255/',
    'ftp://example.com/file',
    'file:///etc/passwd',
  ]

  blockedUrls.forEach((url) => {
    it(`blocks ${url}`, async () => {
      await expect(scrapeUrl(url)).rejects.toBeInstanceOf(ScrapingError)
      await expect(scrapeUrl(url)).rejects.toThrow('not allowed')
    })
  })
})

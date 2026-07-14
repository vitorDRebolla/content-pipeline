export class ScrapingError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'ScrapingError'
  }
}

export class GenerationError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'GenerationError'
  }
}

export class PublishingError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'PublishingError'
  }
}

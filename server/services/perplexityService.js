/**
 * Perplexity Service Compatibility Bridge
 * Routes requests to Tavily Search Service (replaces Perplexity API)
 */

const tavilyService = require('./tavilyService');

module.exports = {
  searchWithPerplexity: tavilyService.searchWithTavily,
  validateApiKey: tavilyService.validateApiKey,
  ...tavilyService
};

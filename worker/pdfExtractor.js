const pdf = require('pdf-parse')

async function extractText(buffer, contentType='application/pdf') {
  if (contentType === 'application/pdf') {
    const data = await pdf(buffer)
    return data.text
  } else {
    // treat as plain text
    return buffer.toString('utf-8')
  }
}

module.exports = { extractText }

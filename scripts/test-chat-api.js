// Test the Chat API with real database integration
const fs = require('fs')

require('dotenv').config({ path: '.env' })

const API_URL = 'http://localhost:3002/api/chat/blox-wizard'

async function testChatAPI() {
  console.log('🧪 Testing Chat API with real database integration...')
  
  const testQueries = [
    "How do I create a part in Roblox Studio?",
    "Can you help me with scripting?", 
    "What are variables in Lua?",
    "How do I make a GUI button?",
    "Building techniques for beginners"
  ]
  
  const results = []
  
  for (const query of testQueries) {
    console.log(`\n🔍 Testing query: "${query}"`)
    
    try {
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          message: query,
          sessionId: 'test-session-' + Date.now(),
          userId: 'test-user'
        })
      })
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }
      
      const data = await response.json()
      
      console.log(`✅ Response received (${data.responseTime})`)
      console.log(`📹 Video references: ${data.videoReferences?.length || 0}`)
      console.log(`💬 Answer preview: ${data.answer?.substring(0, 100)}...`)
      console.log(`❓ Suggested questions: ${data.suggestedQuestions?.length || 0}`)
      
      results.push({
        query,
        success: true,
        responseTime: data.responseTime,
        videoReferences: data.videoReferences?.length || 0,
        answerLength: data.answer?.length || 0,
        suggestedQuestions: data.suggestedQuestions?.length || 0
      })
      
    } catch (error) {
      console.error(`❌ Failed: ${error.message}`)
      results.push({
        query,
        success: false,
        error: error.message
      })
    }
  }
  
  // Summary
  console.log('\n📊 Test Results Summary:')
  const successful = results.filter(r => r.success).length
  console.log(`✅ Successful queries: ${successful}/${testQueries.length}`)
  
  if (successful > 0) {
    const avgResponseTime = results
      .filter(r => r.success && r.responseTime)
      .reduce((sum, r) => sum + parseInt(r.responseTime), 0) / successful
    
    console.log(`⏱️  Average response time: ${avgResponseTime.toFixed(0)}ms`)
    
    const totalVideoRefs = results.reduce((sum, r) => sum + (r.videoReferences || 0), 0)
    console.log(`🎥 Total video references: ${totalVideoRefs}`)
  }
  
  // Save detailed results
  const resultsFile = 'chat-api-test-results.json'
  fs.writeFileSync(resultsFile, JSON.stringify({
    timestamp: new Date().toISOString(),
    testQueries,
    results,
    summary: {
      successful,
      total: testQueries.length,
      successRate: (successful / testQueries.length * 100).toFixed(1) + '%'
    }
  }, null, 2))
  
  console.log(`💾 Detailed results saved to: ${resultsFile}`)
  
  if (successful === testQueries.length) {
    console.log('\n🎉 All tests passed! Chat API is working correctly.')
  } else {
    console.log('\n⚠️  Some tests failed. Check the error details above.')
  }
}

// Test API status first
async function testAPIStatus() {
  try {
    console.log('🔍 Testing API status...')
    const response = await fetch(API_URL, { method: 'GET' })
    
    if (response.ok) {
      const data = await response.json()
      console.log('✅ API is running:', data.message)
      console.log('🔧 Version:', data.version)
      return true
    } else {
      console.error('❌ API status check failed:', response.status, response.statusText)
      return false
    }
  } catch (error) {
    console.error('❌ API not accessible:', error.message)
    console.log('\n💡 Make sure to start the development server:')
    console.log('   npm run dev')
    return false
  }
}

async function main() {
  const isAPIRunning = await testAPIStatus()
  
  if (isAPIRunning) {
    await testChatAPI()
  } else {
    console.log('\n❌ Cannot run tests - API is not accessible')
  }
}

if (require.main === module) {
  main()
}
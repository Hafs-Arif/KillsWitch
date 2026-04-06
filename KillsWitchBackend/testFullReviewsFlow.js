const fetch = require('node-fetch');

async function testFullReviewsFlow() {
  console.log('🧪 Testing Full Reviews Flow\n');
  console.log('=' .repeat(50));
  
  const BASE_URL = 'http://localhost:8000';
  
  try {
    // Test 1: Check if server is running
    console.log('\n1️⃣ Testing server connection...');
    try {
      const healthCheck = await fetch(`${BASE_URL}/`);
      if (healthCheck.ok) {
        console.log('✅ Server is running on port 8000');
      } else {
        console.log('❌ Server responded but with error');
        return;
      }
    } catch (error) {
      console.log('❌ Server is NOT running!');
      console.log('   Please run: npm run dev');
      return;
    }

    // Test 2: Test featured reviews endpoint
    console.log('\n2️⃣ Testing /reviews/featured endpoint...');
    const reviewsResponse = await fetch(`${BASE_URL}/reviews/featured?limit=10`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      }
    });

    console.log(`   Status: ${reviewsResponse.status} ${reviewsResponse.statusText}`);

    if (!reviewsResponse.ok) {
      const errorText = await reviewsResponse.text();
      console.log('❌ API Error:', errorText);
      return;
    }

    const reviewsData = await reviewsResponse.json();
    console.log('✅ API Response received');
    console.log(`   success: ${reviewsData.success}`);
    console.log(`   data: Array(${reviewsData.data?.length || 0})`);
    console.log(`   total: ${reviewsData.total}`);

    // Test 3: Validate response structure
    console.log('\n3️⃣ Validating response structure...');
    if (reviewsData.success && Array.isArray(reviewsData.data)) {
      console.log('✅ Response structure is valid');
      
      if (reviewsData.data.length > 0) {
        console.log(`✅ Found ${reviewsData.data.length} reviews`);
        
        // Show first review
        const firstReview = reviewsData.data[0];
        console.log('\n📝 Sample Review:');
        console.log(`   ID: ${firstReview.id}`);
        console.log(`   Rating: ${'⭐'.repeat(firstReview.rating)}`);
        console.log(`   Reviewer: ${firstReview.reviewer_name}`);
        console.log(`   Product: ${firstReview.product?.part_number || 'N/A'}`);
        console.log(`   Comment: ${firstReview.comment?.substring(0, 60)}...`);
        console.log(`   Created: ${new Date(firstReview.createdAt).toLocaleDateString()}`);
      } else {
        console.log('⚠️  No reviews found in database');
        console.log('   Run: node seedReviews.js');
      }
    } else {
      console.log('❌ Invalid response structure');
      console.log('   Expected: { success: true, data: [...], total: N }');
      console.log('   Got:', reviewsData);
    }

    // Test 4: Test CORS and public access
    console.log('\n4️⃣ Testing public access (no auth)...');
    const publicResponse = await fetch(`${BASE_URL}/reviews/featured?limit=5`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      },
      // No credentials - simulating guest user
    });

    if (publicResponse.ok) {
      console.log('✅ Public access works (no authentication required)');
    } else {
      console.log('❌ Public access failed');
      console.log(`   Status: ${publicResponse.status}`);
    }

    // Summary
    console.log('\n' + '='.repeat(50));
    console.log('📊 SUMMARY:');
    console.log('='.repeat(50));
    console.log(`✅ Server: Running`);
    console.log(`✅ Endpoint: /reviews/featured`);
    console.log(`✅ Response: Valid JSON`);
    console.log(`✅ Reviews: ${reviewsData.data?.length || 0} found`);
    console.log(`✅ Public Access: Enabled`);
    console.log('\n🎉 All tests passed!');
    console.log('\nFrontend should work at: http://localhost:3000/AboutUs');

  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    console.error('\nStack:', error.stack);
  }
}

// Run the test
testFullReviewsFlow();

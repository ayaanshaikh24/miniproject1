// Quick verification: ensure no stores share the same misleading product-level rating
async function main() {
  console.log('=== Verifying per-store rating fix ===\n');
  
  const res = await fetch('http://localhost:3001/api/search?q=iphone+15');
  const data = await res.json();
  const retailers = data.retailers || [];
  
  console.log(`Total retailers: ${retailers.length}\n`);
  
  const ratingCounts = {};
  for (const r of retailers) {
    const key = `${r.rating}|${r.reviews}`;
    ratingCounts[key] = (ratingCounts[key] || 0) + 1;
    
    const hasRating = r.rating > 0;
    const display = hasRating 
      ? `★ ${r.rating} (${r.reviews} reviews)` 
      : 'No store ratings';
    console.log(`  ${r.store}: ${display} | source=${r.source}`);
  }
  
  // Check for shared ratings
  const sharedRatings = Object.entries(ratingCounts)
    .filter(([key, count]) => key !== '0|0' && count > 1);
  
  if (sharedRatings.length > 0) {
    console.log('\n❌ PROBLEM: Multiple stores share the same rating:');
    for (const [key, count] of sharedRatings) {
      console.log(`   ${key} appears ${count} times`);
    }
  } else {
    console.log('\n✅ No duplicate product-level ratings across stores');
  }
  
  // Check that stores without ratings don't show "N/A"
  const noRating = retailers.filter(r => !r.rating || r.rating === 0);
  console.log(`\nStores without ratings: ${noRating.length} (will show "No store ratings" on frontend)`);
  noRating.forEach(r => console.log(`  → ${r.store}`));
}

main().catch(console.error);

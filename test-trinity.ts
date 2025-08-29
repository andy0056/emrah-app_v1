// Trinity Pipeline Test Script
import { TrinityPipeline } from './src/services/falService';

async function testTrinity() {
  const testData = {
    brand: "Coca-Cola",
    product: "1L Bottle",
    standType: "floor stand",
    standWidth: 40,
    standDepth: 30,
    standHeight: 160,
    materials: ["metal", "acrylic"],
    standBaseColor: "#FF0000",
    shelfCount: 3,
    frontFaceCount: 4,
    backToBackCount: 2
  };

  console.log("🚀 Testing Trinity Pipeline...");
  console.log("📊 Test Data:", testData);
  
  try {
    console.log("\n=== SINGLE VIEW TEST ===");
    const singleResult = await TrinityPipeline.generateTrinityImage(
      testData,
      'frontView'
    );
    
    console.log("✅ SINGLE VIEW SUCCESS!");
    console.log("🖼️  Final Image URL:", singleResult.url);
    console.log("🔗 Stage URLs:");
    console.log("   - Base (PULID):", singleResult.stages.base);
    console.log("   - Enhanced (Lightning):", singleResult.stages.enhanced);
    console.log("   - Final (Recraft):", singleResult.stages.final);
    
    console.log("\n=== ALL VIEWS TEST ===");
    const allResults = await TrinityPipeline.generateAllViews(testData);
    
    console.log("✅ ALL VIEWS SUCCESS!");
    console.log("🖼️  Results:");
    console.log("   - Front View:", allResults.frontView);
    console.log("   - Store View:", allResults.storeView);
    console.log("   - 3/4 View:", allResults.threeQuarterView);
    
    console.log("\n🎉 Trinity Pipeline test completed successfully!");
    
  } catch (error) {
    console.error("❌ TRINITY PIPELINE TEST FAILED:");
    console.error("Error:", error.message);
    console.error("Stack:", error.stack);
  }
}

// Uncomment to run test
// testTrinity();

export { testTrinity };
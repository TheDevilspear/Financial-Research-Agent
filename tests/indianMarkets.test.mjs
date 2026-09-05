import assert from "node:assert/strict";
import { 
  INDIAN_TICKER_ALIASES, 
  fetchCompanyProfile, 
  fetchStockHistory 
} from "../server/lib/marketData.ts";
import { 
  getLatestSecFilings, 
  getSecCompanyFacts, 
  fetchIndianCompanyData 
} from "../server/lib/secEdgar.ts";

async function runTests() {
  console.log("==================================================");
  console.log("🧪 STARTING INDIAN MARKETS RESOLUTION & FILINGS TESTS");
  console.log("==================================================\n");

  // Test 1: Verify Alias Map
  console.log("Test 1: Verifying INDIAN_TICKER_ALIASES mapping...");
  assert.equal(INDIAN_TICKER_ALIASES["SBI"], "SBIN", "SBI alias should map to SBIN");
  assert.equal(INDIAN_TICKER_ALIASES["STATE BANK OF INDIA"], "SBIN");
  assert.equal(INDIAN_TICKER_ALIASES["HDFC"], "HDFCBANK");
  assert.equal(INDIAN_TICKER_ALIASES["RIL"], "RELIANCE");
  assert.equal(INDIAN_TICKER_ALIASES["TCS"], "TCS");
  assert.equal(INDIAN_TICKER_ALIASES["TATA MOTORS"], "TATAMOTORS");
  assert.equal(INDIAN_TICKER_ALIASES["INFOSYS"], "INFY");
  console.log("✅ Test 1 Passed: Alias mappings are accurate.\n");

  // Test 2: Screener Data Fetch for SBI -> SBIN
  console.log("Test 2: Testing fetchIndianCompanyData for 'SBI'...");
  const sbiScreener = await fetchIndianCompanyData("SBI");
  console.log("   SBI Screener Match:", sbiScreener?.name, "| URL:", sbiScreener?.url);
  assert(sbiScreener !== null, "fetchIndianCompanyData should resolve SBI via alias SBIN");
  assert(sbiScreener.name.toLowerCase().includes("state bank of india"), "Name should match State Bank of India");
  assert(sbiScreener.url.includes("/SBIN/"), "Screener URL should reference SBIN");
  console.log("✅ Test 2 Passed: 'SBI' resolves to State Bank of India (SBIN).\n");

  // Test 3: Company Profile & Market Data Resolution for SBI
  console.log("Test 3: Testing fetchCompanyProfile and fetchStockHistory for 'SBI'...");
  const sbiProfile = await fetchCompanyProfile("SBI");
  console.log("   SBI Profile:", sbiProfile);
  assert(sbiProfile.name.toLowerCase().includes("state bank of india"), `Profile name '${sbiProfile.name}' must contain 'State Bank of India'`);
  assert(!sbiProfile.name.toLowerCase().includes("western asset"), "SBI must NEVER resolve to Western Asset Intermediate Muni Fund");
  assert.equal(sbiProfile.currency, "INR", "SBI currency must be INR");

  const sbiHistory = await fetchStockHistory("SBI");
  console.log("   SBI History:", { currency: sbiHistory.currency, points: sbiHistory.points.length, companyName: sbiHistory.companyName });
  assert.equal(sbiHistory.currency, "INR", "History currency must be INR");
  assert(sbiHistory.points.length > 0, "Should have price history points");
  console.log("✅ Test 3 Passed: Profile and Stock History correctly resolve SBI in INR.\n");

  // Test 4: Verify Filings Routing for 'SBI' (Must Route to BSE/NSE, NOT SEC EDGAR)
  console.log("Test 4: Verifying filings routing for 'SBI'...");
  const sbiFilings = await getLatestSecFilings("SBI", sbiProfile.name);
  console.log("   Entity Name:", sbiFilings.entityName);
  console.log("   Filings count:", sbiFilings.filings.length);
  console.log("   First filing:", sbiFilings.filings[0]);
  
  assert(!sbiFilings.cik, "Indian entity must not have a US SEC CIK");
  assert(sbiFilings.entityName.toLowerCase().includes("state bank of india"), "Entity name should be State Bank of India");
  assert(!sbiFilings.entityName.toLowerCase().includes("western asset"), "Entity name must not be Western Asset Muni Fund");
  assert(sbiFilings.filings.some(f => f.form.includes("Reg 33") || f.form.includes("Annual Report") || f.accessionNumber.includes("BSE") || f.accessionNumber.includes("NSE")), "Filings must be Indian BSE/NSE filings");
  console.log("✅ Test 4 Passed: Filings correctly routed to BSE/NSE.\n");

  // Test 5: Verify Indian Facts Extraction for 'SBI'
  console.log("Test 5: Testing getSecCompanyFacts for 'SBI'...");
  const sbiFacts = await getSecCompanyFacts("SBI", sbiProfile.name);
  console.log("   Facts Entity:", sbiFacts.entityName);
  console.log("   Revenue count:", sbiFacts.facts.revenue?.length);
  console.log("   Sample Revenue Item:", sbiFacts.facts.revenue?.[0]);
  assert(sbiFacts.facts.revenue && sbiFacts.facts.revenue.length > 0, "Revenue quarters should be present");
  assert(sbiFacts.facts.revenue[0].unit.includes("INR") || sbiFacts.facts.revenue[0].unit.includes("Cr"), "Unit must be in INR / Crores");
  console.log("✅ Test 5 Passed: Multi-quarter financial facts extracted in ₹ Crores.\n");

  // Test 6: Verify other major Indian symbols (RELIANCE, TCS, HDFC, TATAMOTORS)
  console.log("Test 6: Testing broader Indian tickers (RELIANCE, TCS, HDFC)...");
  const relianceProfile = await fetchCompanyProfile("RELIANCE");
  console.log("   RELIANCE Profile:", relianceProfile.name, relianceProfile.currency);
  assert(relianceProfile.name.toLowerCase().includes("reliance"), "RELIANCE should resolve to Reliance Industries");
  assert.equal(relianceProfile.currency, "INR");

  const tcsProfile = await fetchCompanyProfile("TCS");
  console.log("   TCS Profile:", tcsProfile.name, tcsProfile.currency);
  assert(tcsProfile.name.toLowerCase().includes("tata consultancy") || tcsProfile.name.toLowerCase().includes("tcs"), "TCS should resolve to Tata Consultancy");
  assert.equal(tcsProfile.currency, "INR");

  const hdfcProfile = await fetchCompanyProfile("HDFC");
  console.log("   HDFC Profile:", hdfcProfile.name, hdfcProfile.currency);
  assert(hdfcProfile.name.toLowerCase().includes("hdfc"), "HDFC should resolve to HDFC Bank");
  assert.equal(hdfcProfile.currency, "INR");
  console.log("✅ Test 6 Passed: Major Indian tickers resolve with INR and proper corporate entities.\n");

  // Test 7: Verify US Stock (NVDA) still works with US SEC EDGAR
  console.log("Test 7: Verifying global stock (NVDA) still routes to SEC EDGAR...");
  const nvdaFilings = await getLatestSecFilings("NVDA");
  console.log("   NVDA Filings CIK:", nvdaFilings.cik, "Entity:", nvdaFilings.entityName);
  assert.equal(nvdaFilings.cik, "0001045810", "NVDA must resolve to CIK 0001045810");
  assert(nvdaFilings.filings.some(f => f.form === "Form 10-K" || f.form === "10-K" || f.form === "10-Q"), "NVDA filings must include 10-K or 10-Q");
  console.log("✅ Test 7 Passed: US stocks continue to properly query SEC EDGAR.\n");

  console.log("==================================================");
  console.log("🎉 ALL TESTS PASSED SUCCESSFULLY!");
  console.log("==================================================");
}

runTests().catch(err => {
  console.error("❌ TEST FAILED:", err);
  process.exit(1);
});

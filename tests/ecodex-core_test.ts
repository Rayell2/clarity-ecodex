import {
  Clarinet,
  Tx,
  Chain,
  Account,
  types
} from 'https://deno.land/x/clarinet@v1.0.0/index.ts';
import { assertEquals } from 'https://deno.land/std@0.90.0/testing/asserts.ts';

Clarinet.test({
  name: "Ensure product registration works",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    const deployer = accounts.get("deployer")!;
    
    let block = chain.mineBlock([
      Tx.contractCall(
        "ecodex-core",
        "register-product",
        [types.uint(1), types.utf8("Eco Product"), types.uint(100), types.uint(80)],
        deployer.address
      )
    ]);
    
    assertEquals(block.receipts.length, 1);
    assertEquals(block.height, 2);
    assertEquals(block.receipts[0].result.expectOk(), true);

    // Verify product details
    const productDetails = chain.callReadOnlyFn(
      "ecodex-core",
      "get-product-details",
      [types.uint(1)],
      deployer.address
    );
    
    assertEquals(productDetails.result.expectSome().data['name'], 'Eco Product');
    assertEquals(productDetails.result.expectSome().data['verified'], false);
  }
});

Clarinet.test({
  name: "Ensure only owner can verify products",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    const deployer = accounts.get("deployer")!;
    const wallet1 = accounts.get("wallet_1")!;
    
    // First register a product
    let block = chain.mineBlock([
      Tx.contractCall(
        "ecodex-core",
        "register-product",
        [types.uint(1), types.utf8("Eco Product"), types.uint(100), types.uint(80)],
        deployer.address
      )
    ]);
    
    // Try to verify with non-owner
    block = chain.mineBlock([
      Tx.contractCall(
        "ecodex-core",
        "verify-product",
        [types.uint(1)],
        wallet1.address
      )
    ]);
    
    assertEquals(block.receipts[0].result.expectErr(), 'u100');
    
    // Verify with owner
    block = chain.mineBlock([
      Tx.contractCall(
        "ecodex-core",
        "verify-product",
        [types.uint(1)],
        deployer.address
      )
    ]);
    
    assertEquals(block.receipts[0].result.expectOk(), true);
  }
});

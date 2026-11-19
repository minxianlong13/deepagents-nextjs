import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { parseQuoteResponse } from "../parse-quote-response";

describe("parseQuoteResponse", () => {
  it("reads a fenced JSON block after prose", () => {
    const quote = parseQuoteResponse('Here is the price.\n```json\n{"symbol":"XEQT","price":34.12,"currency":"CAD","asOf":"2026-11-18T15:00:00Z","sourceUrl":"https://example.com/q/XEQT"}\n```');
    assert.deepEqual(quote, { symbol: "XEQT", price: "34.12", currency: "CAD", asOf: "2026-11-18T15:00:00Z", sourceUrl: "https://example.com/q/XEQT" });
  });

  it("reads a bare trailing JSON object and strips thousands separators", () => {
    const quote = parseQuoteResponse('Result: {"symbol":"BRK.A","price":"712,345.50","currency":"USD","sourceUrl":"https://example.com"}');
    assert.equal(quote.price, "712345.50");
    assert.equal(quote.asOf, null);
  });

  it("drops non-http source URLs", () => {
    const quote = parseQuoteResponse('{"symbol":"A","price":"1","currency":"CAD","sourceUrl":"javascript:alert(1)"}');
    assert.equal(quote.sourceUrl, null);
  });

  it("surfaces the agent's reason when no price was found", () => {
    assert.throws(() => parseQuoteResponse('{"symbol":"ZZZ","price":null,"currency":"CAD","error":"Ticker not found"}'), /Ticker not found/);
  });

  it("rejects replies without usable JSON", () => {
    assert.throws(() => parseQuoteResponse("The price is about $34."), /did not return/);
    assert.throws(() => parseQuoteResponse("{not json}"), /unreadable/);
    assert.throws(() => parseQuoteResponse('{"symbol":"A"}'), /incomplete/);
  });
});

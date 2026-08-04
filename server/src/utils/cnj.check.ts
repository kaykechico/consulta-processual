import assert from "node:assert/strict";
import { apenasDigitos, formatarCNJ, validarCNJ } from "./cnj";
import { siglaDataJud } from "./tribunal";

assert.equal(apenasDigitos("0000832-35.2018.4.01.3202"), "00008323520184013202");
assert.equal(formatarCNJ("00008323520184013202"), "0000832-35.2018.4.01.3202");

assert.equal(validarCNJ("00008323520184013202"), true);
assert.equal(validarCNJ("10092161720238260016"), true);
assert.equal(validarCNJ("0000832-35.2018.4.01.3202"), true);
assert.equal(validarCNJ("10000000020258260100"), false);
assert.equal(validarCNJ("123"), false);
assert.equal(validarCNJ(""), false);

assert.equal(siglaDataJud("00008323520184013202"), "trf1");
assert.equal(siglaDataJud("10092161720238260016"), "tjsp");
assert.equal(siglaDataJud("00000010020205000000"), "tst");
assert.equal(siglaDataJud("00000010020201000000"), "stf");
assert.equal(siglaDataJud("00000010020206250100"), "tre-se");
assert.equal(siglaDataJud("00000010020206260100"), "tre-sp");
assert.equal(siglaDataJud("00000010020204060000"), "trf6");
assert.equal(siglaDataJud("00000010020204070000"), null);
assert.equal(siglaDataJud("00000010020209100000"), null);

console.log("cnj.check: OK");

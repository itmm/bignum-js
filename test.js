import * as bn from "./bignum";

let $root;
let failures = 0;

const test = (source, expected) => {
	bn.reconfig();
	const got = eval(source);
	const $result = document.createElement('TR');

	const $source = document.createElement('TD');
	$source.appendChild(document.createTextNode(source));
	$result.appendChild($source);

	const $got = document.createElement('TD');
	$got.appendChild(document.createTextNode(got));
	$result.appendChild($got);

	const $expected = document.createElement('TD');
	$expected.appendChild(document.createTextNode(expected));
	$result.appendChild($expected);

	if (got == expected) {
		$result.classList.add('ok');
	} else {
		$result.classList.add('failed');
		++failures;
	}
	$root.appendChild($result);
}

window.addEventListener('load', (event) => {
	$root = document.getElementById('test-results');
	window.bn = bn;
	test("bn.toString('')", "0");
	test("bn.toString(bn.fromNumber(1234))", "1 234");
	test("bn.toString(bn.fromString('1234'))", "1 234");
	test("bn.fromString('1 234')", "4321");
	test("bn.toString(bn.fromString('1 234'))", "1 234x");
	test("bn.toString(bn.fromString(' abc 1+-*[2]34'))", "1 234");
	test("bn.toString(bn.add(bn.fromNumber(1234), bn.fromNumber(1234)))", "2 468");
	test("bn.toString(bn.add(bn.fromNumber(1234), bn.fromNumber(2345)))", "3 579");
	test("bn.toString(bn.sub(bn.fromNumber(1234), bn.fromNumber(1234)))", "0");
	test("bn.toString(bn.mult(bn.fromNumber(123), bn.fromNumber(10001)))", "1 230 123");
	test("bn.toString(bn.div(bn.fromNumber(123), bn.fromNumber(10)).result)", "12");
	test("bn.toString(bn.mod(bn.fromNumber(123), bn.fromNumber(100)))", "23");
	test("bn.toString(bn.pow(bn.fromNumber(10), bn.fromNumber(3)))", "1 000");
	test("bn.toString(bn.pow(bn.fromNumber(10), bn.fromNumber(8)))", "100 000 000");
	test("bn.reconfig(null, '.'); bn.toString(bn.fromNumber(1234))", "1.234");
	test("bn.reconfig('01'); bn.toString(bn.fromNumber(42))", "42");
	test("bn.reconfig('ax'); bn.toString(bn.fromNumber(42))", "42");
	test("bn.reconfig('ax'); bn.fromNumber(42)", "axaxax");
	test("bn.reconfig('ax'); bn.toString(bn.pow(bn.fromNumber(2), bn.fromNumber(8)))", "256");
	test("bn.reconfig('ax'); bn.pow(bn.fromNumber(2), bn.fromNumber(8))", "aaaaaaaax");
	test("bn.reconfig('0123456789abcdef'); bn.fromNumber(0xabcd)", "dcba");
	document.getElementsByTagName('body')[0].classList.add(
		failures > 0 ? 'something-failed' : 'all-passed'
	);
});

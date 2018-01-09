import * as bn from "./bignum";

let $root;

const test = (source, expected) => {
	const got = eval(source);
	const $result = document.createElement('DIV');
	$result.classList.add('test-result');

	const $source = document.createElement('DIV');
	$source.classList.add('source');
	$source.appendChild(document.createTextNode(source));
	$result.appendChild($source);

	const $got = document.createElement('DIV');
	$got.classList.add('got');
	$got.appendChild(document.createTextNode(got));
	$result.appendChild($got);

	const $expected = document.createElement('DIV');
	$expected.classList.add('expected');
	$expected.appendChild(document.createTextNode(expected));
	$result.appendChild($expected);

	if (got == expected) {
		$result.classList.add('ok');
	} else {
		$result.classList.add('failed');
	}
	$root.appendChild($result);
}

window.addEventListener('load', (event) => {
	$root = document.getElementById('test-results');
	window.bn = bn;
	test('bn.beautify(bn.build(1234))', '1 234');
	test('bn.beautify(bn.add(bn.build(1234), bn.build(1234)))', '2 468');
	test('bn.beautify(bn.add(bn.build(1234), bn.build(2345)))', '3 579');
	test('bn.beautify(bn.minus(bn.build(1234), bn.build(1234)))', '0');
	test('bn.beautify(bn.multiply(bn.build(123), bn.build(10001)))', '1 230 123');
	test('bn.beautify(bn.div(bn.build(123), bn.build(10)).result)', '12');
	test('bn.beautify(bn.mod(bn.build(123), bn.build(100)))', '23');
	test('bn.beautify(bn.power(bn.build(10), bn.build(8)))', '100 000 000');
});

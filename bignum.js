let DIGITS;
let NUMBER_OF_DIGITS;
let THOUSANDS_SEPARATOR;
const ASCII_ZERO = 48;

export const reconfig = (digits, thousands_separator) => {
	if (! digits || digits.length <= 1) { digits = "0123456789"; }
	if (! thousands_separator) { thousands_separator = ' '; }
	DIGITS = digits;
	NUMBER_OF_DIGITS = digits.length;
	THOUSANDS_SEPARATOR = thousands_separator;
}

reconfig();

export const fromNumber = (value) => {
	let bignum = '';
	for (; value > 0; value = Math.trunc(value / NUMBER_OF_DIGITS)) { 
		bignum += DIGITS.charAt(value % NUMBER_OF_DIGITS); 
	}
	return bignum;
};

export const fromString = (string) => {
	let bignum = '';
	for (let i = 0; i < string.length; ++i) {
		const idx = string.charCodeAt(i) - ASCII_ZERO;
		if (NUMBER_OF_DIGITS == 10) {
			if (idx > 0 || (idx == 0 && bignum.length)) {
				bignum = DIGITS.charAt(idx) + bignum;
			}
		} else {
		}
	}
	return bignum;
};

export const toString = (bignum) => {
	if (bignum.length <= 0) { return '0'; }

	let string = '';
	if (NUMBER_OF_DIGITS == 10) {
		for (let i = 0; i < bignum.length; ++i) {
			if (i % 3 == 0 && i > 0) { string = THOUSANDS_SEPARATOR + string; }
			string = String.fromCharCode(DIGITS.indexOf(bignum.charAt(i)) + ASCII_ZERO) + string;
		}
	} else {
		const ten = fromNumber(10);
		let i = 0;
		while (bignum.length) {
			if (i % 3 == 0 && i > 0) { string = THOUSANDS_SEPARATOR + string; }
			const dd = div(bignum, ten);
			let digit = 0;
			for (let j = dd.mod.length - 1; j >= 0; --j) {
				digit = digit * NUMBER_OF_DIGITS + DIGITS.indexOf(dd.mod.charAt(j));
			}
			string = String.fromCharCode(digit + ASCII_ZERO) + string;
			bignum = dd.result;
			++i;
		}
	}
	return string;
};

export const add = (bn_a, bn_b) => {
	let bn_result = '';
	let carry = 0;
	for (let i = 0; i < bn_a.length || i < bn_b.length || carry > 0; ++i) {
		let digit = carry;
		if (i < bn_a.length) { digit += DIGITS.indexOf(bn_a.charAt(i)); }
		if (i < bn_b.length) { digit += DIGITS.indexOf(bn_b.charAt(i)); };
		if (digit >= NUMBER_OF_DIGITS) { digit -= NUMBER_OF_DIGITS; carry = 1; } else { carry = 0; }
		bn_result += DIGITS.charAt(digit);
	}
	return bn_result;
};

export const equals = (bn_a, bn_b) => { return bn_a == bn_b; };

export const less = (bn_a, bn_b) => {
	for (let i = Math.max(bn_a.length, bn_b.length) - 1; i >= 0; --i) {
		const ca = i < bn_a.length ? DIGITS.indexOf(bn_a.charAt(i)) : 0;
		const cb = i < bn_b.length ? DIGITS.indexOf(bn_b.charAt(i)) : 0;
		if (ca < cb) { return true; }
		if (ca > cb) { return false; }
	}
	return false;
};

const err = (message) => { if (console && console.log) { console.log(message); } };

export const sub = (bn_a, bn_b) => {
	let bn_result = '';
	if (less(bn_a, bn_b)) { err('underflow clamped to zero'); return bn_result; }

	let carry = 0;
	for (let i = 0; i < bn_a.length; ++i) {
		let digit = DIGITS.indexOf(bn_a.charAt(i)) + carry;
		if (i < bn_b.length) { digit -= DIGITS.indexOf(bn_b.charAt(i)); }
		if (digit < 0) { digit += NUMBER_OF_DIGITS; carry = -1; } else { carry = 0; }
		bn_result += DIGITS.charAt(digit);
	}
	if (carry < 0) { err('underflow ignoring last carry'); }

	let i;
	const zero_code = DIGITS.charCodeAt(0);
	for (i = bn_result.length - 1; i >= 0 && bn_result.charCodeAt(i) == zero_code; --i);

	return bn_result.substring(0, i + 1);
};

const mult_digit = (bignum, digit) => {
	switch (digit) {
		case 0: return '';
		case 1: return bignum;
		default: break;
	}

	let bn_product = '';
	let carry = 0;
	for (let i = 0; i < bignum.length || carry; ++i) {
		let simple_product = carry;
		if (i < bignum.length) { 
			simple_product += digit * DIGITS.indexOf(bignum.charAt(i));
		}
		bn_product += DIGITS.indexOf(simple_product % NUMBER_OF_DIGITS);
		carry = Math.trunc(simple_product / NUMBER_OF_DIGITS);
	}

	return bn_product;
};

export const mult = (bn_a, bn_b, bn_mod) => {
	let bn_result = '';
	let prefix = '';
	for (let i = 0; i < bn_a.length; ++i) {
		let bn_part = prefix + mult_digit(bn_b, DIGITS.indexOf(bn_a.charAt(i)));
		bn_result = add(bn_result, bn_part);
		prefix += DIGITS.charAt(0);
	}
	return mod(bn_result, bn_mod);
};

const div_single = (bn_a, bn_b) => {
	if (bn_b.length <= 0) { err("divide by zero"); return { digit: 0, mod: '' }; }
	if (less(bn_a, bn_b)) { return { digit: 0, mod: bn_a }; }

	const high_b = DIGITS.indexOf(bn_b.charAt(bn_b.length - 1));
	
	let high_a = 0;
	
	for (let i = 0; bn_a.length >= bn_b.length + i; ++i) {
		high_a = high_a * NUMBER_OF_DIGITS + DIGITS.indexOf(bn_a.charAt(bn_a.length - 1 - i));
	}
	let digit = Math.trunc(high_a / high_b);

	if (digit == NUMBER_OF_DIGITS) { --digit; };
	if (digit >= NUMBER_OF_DIGITS) { err("digit too big: " + digit); return { digit: 0, mod: '' }; }

	const value = mult_digit(bn_b, digit);
	const rest = sub(bn_a, value);

	return { digit: digit, mod: rest };
}

export const div = (bn_a, bn_b) => {
	if (bn_b.length <= 0) { err("divide by zero"); return { result: '', mod: '' }; }
	if (less(bn_a, bn_b)) { return { result: '', mod: bn_a }; }

	let bn_result = '';
	let cur = '';
	for (let i = bn_a.length - 1; i >= 0; --i) {
		cur = bn_a.charAt(i) + cur;
		const dd = div_single(cur, bn_b);
		if (dd.digit > 0 || bn_result.length > 0) {
			bn_result = DIGITS.charAt(dd.digit) + bn_result;
		}
		cur = dd.mod;
	}
	
	return { result : bn_result, mod: cur };
};

export const mod = (bignum, bn_mod) => {
	if (! bn_mod || bn_mod.length <= 0) { return bignum; }
	let result = div(bignum, bn_mod);
	return result.mod;
};

export const pow = (bn_base, bn_exp, bn_mod) => {
	let result = fromNumber(1);
	let two = fromNumber(2);
	while (bn_exp.length > 0) {
		const dd = div(bn_exp, two);
		const even = (dd.mod.length > 0) && (DIGITS.indexOf(dd.mod.charAt(0)) % 2 == 1);
		if (even) { result = mult(result, bn_base, bn_mod); }
		bn_base = mult(bn_base, bn_base, bn_mod);
		bn_exp = dd.result;
	}
	return result;
}

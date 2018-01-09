const DIGITS = "0123456789";

export const build = (value) => {
	let bignum = '';
	for (; value > 0; value = Math.trunc(value / 10)) { bignum += DIGITS.charAt(value % 10); }
	return bignum;
};

export const normalize = (string) => {
	let bignum = '';
	for (let i = 0; i < string.length; ++i) {
		const ch = string.charAt(i);
		switch (ch) {
			case '1': case '2': case '3':
			case '4': case '5': case '6':
			case '7': case '8': case '9':
				bignum = ch + bignum;
				break;
			case '0':
				if (bignum.length) { bignum = ch + bignum; }
				break;
			default:
				break;
		}
	}
	return bignum;
};

export const beautify = (bignum) => {
	if (bignum.length <= 0) { return '0'; }

	let string = '';
	for (let i = 0; i < bignum.length; ++i) {
		if (i % 3 == 0 && i > 0) { string = ' ' + string; }
		string = bignum[i] + string;
	}
	return string;
};

const ZERO_ASCII_CODE = 48;

export const add = (bn_a, bn_b) => {
	let bn_result = '';
	let carry = 0;
	for (let i = 0; i < bn_a.length || i < bn_b.length || carry > 0; ++i) {
		let digit = carry;
		if (i < bn_a.length) { digit += bn_a.charCodeAt(i) - ZERO_ASCII_CODE; }
		if (i < bn_b.length) { digit += bn_b.charCodeAt(i) - ZERO_ASCII_CODE; };
		if (digit >= 10) { digit -= 10; carry = 1; } else { carry = 0; }
		bn_result += String.fromCharCode(digit + ZERO_ASCII_CODE);
	}
	return bn_result;
};

export const equals = (bn_a, bn_b) => { return bn_a == bn_b; };

export const less = (bn_a, bn_b) => {
	for (let i = Math.max(bn_a.length, bn_b.length) - 1; i >= 0; --i) {
		const ca = i < bn_a.length ? bn_a.charCodeAt(i) : ZERO_ASCII_CODE;
		const cb = i < bn_b.length ? bn_b.charCodeAt(i) : ZERO_ASCII_CODE;
		if (ca < cb) { return true; }
		if (ca > cb) { return false; }
	}
	return false;
};

const err = (message) => { if (console && console.log) { console.log(message); } };

export const minus = (bn_a, bn_b) => {
	let bn_result = '';
	if (less(bn_a, bn_b)) { err('underflow clamped to zero'); return bn_result; }

	let carry = 0;
	for (let i = 0; i < bn_a.length; ++i) {
		let digit = bn_a.charCodeAt(i) - ZERO_ASCII_CODE + carry;
		if (i < bn_b.length) { digit -= bn_b.charCodeAt(i) - ZERO_ASCII_CODE; }
		if (digit < 0) { digit += 10; carry = -1; } else { carry = 0; }
		bn_result += String.fromCharCode(digit + ZERO_ASCII_CODE);
	}
	if (carry < 0) { err('underflow ignoring last carry'); }

	let i;
	for (i = bn_result.length - 1; i >= 0 && bn_result.charCodeAt(i) == ZERO_ASCII_CODE; --i);

	return bn_result.substring(0, i + 1);
};

const multiply_digit = (bignum, digit) => {
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
			simple_product += digit * (bignum.charCodeAt(i) - ZERO_ASCII_CODE);
		}
		bn_product += String.fromCharCode((simple_product % 10) + ZERO_ASCII_CODE);
		carry = Math.trunc(simple_product / 10);
	}

	return bn_product;
};

export const multiply = (bn_a, bn_b) => {
	let bn_result = '';
	let prefix = '';
	for (let i = 0; i < bn_a.length; ++i) {
		let bn_part = prefix + multiply_digit(bn_b, bn_a.charCodeAt(i) - ZERO_ASCII_CODE);
		bn_result = add(bn_result, bn_part);
		prefix += '0';
	}
	return bn_result;
};

const div_single = (bn_a, bn_b) => {
	if (bn_b.length <= 0) { err("divide by zero"); return { digit: 0, mod: '' }; }
	if (less(bn_a, bn_b)) { return { digit: 0, mod: bn_a }; }

	const high_b = bn_b.charCodeAt(bn_b.length - 1) - ZERO_ASCII_CODE;
	
	let high_a = 0;
	
	for (let i = 0; bn_a.length >= bn_b.length + i; ++i) {
		high_a = high_a * 10 + bn_a.charCodeAt(bn_a.length - 1 - i) - ZERO_ASCII_CODE;
	}
	let digit = Math.trunc(high_a / high_b);

	if (err >= 10) { err("digit too big: " + digit); return { digit: 0, mod: '' }; }

	const value = multiply_digit(bn_b, digit);
	const rest = minus(bn_a, value);
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

export const power = (bn_base, bn_exp, bn_mod) => {
	let result = '1';
	while (bn_exp.length > 0) {
		const first = bn_exp.charCodeAt(0) - ZERO_ASCII_CODE;
		const even = (first % 2 == 1);
		if (even) { result = mod(multiply(result, bn_base), bn_mod); }
		bn_base = mod(multiply(bn_base, bn_base), bn_mod);
		bn_exp = div(bn_exp, '2').result;
	}
	return result;
}

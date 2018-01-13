let DIGITS;
let NUMBER_OF_DIGITS;
let THOUSANDS_SEPARATOR;
const ASCII_ZERO = 48;

export const reconfig = (options) => {
	if (! options) { options = {}; }
	if (! ('digits' in options) || (('digits' in options) && options.digits.length <= 1)) { 
		options.digits = "0123456789";
	}
	if (! ('thousands_separator' in options)) { options.thousands_separator = ' '; }
	DIGITS = options.digits;
	NUMBER_OF_DIGITS = options.digits.length;
	THOUSANDS_SEPARATOR = options.thousands_separator;
}

reconfig();

export const fromNumber = (value) => {
	let bignum = '';
	if (value < 0) { bignum = '-'; value = -value; }
	for (; value > 0; value = Math.trunc(value / NUMBER_OF_DIGITS)) { 
		bignum += DIGITS.charAt(value % NUMBER_OF_DIGITS); 
	}
	return bignum;
};

const negate = (bn) => {
	if (bn.length > 0 && bn.charAt(0) === '-') {
		return bn.substr(1);
	} else if (bn.length > 0) {
		return '-' + bn;
	} else {
		return bn;
	}
};

export const fromString = (string) => {
	let bignum = '';

	let start = 0;
	let negative = false;
	if (string.length > 0 && string.charAt(0) === '-') {
		negative = true;
		start = 1;
	}

	const ten = fromNumber(10);
	for (let i = start; i < string.length; ++i) {
		const idx = string.charCodeAt(i) - ASCII_ZERO;
		if (idx > 9 || idx < 0 || (idx === 0 && bignum.length <= 0)) { continue; }
		if (NUMBER_OF_DIGITS == 10) {
			bignum = DIGITS.charAt(idx) + bignum;
		} else {
			bignum = add(mult(bignum, ten), fromNumber(idx));
		}
	}

	if (negative) { bignum = negate(bignum); }
	return bignum;
};

export const toString = (bignum) => {
	if (bignum.length <= 0) { return '0'; }

	let string = '';
	let start = 0;

	if (bignum.length > 0 && bignum.charAt(0) === '-') {
		start = 1;
	}

	if (NUMBER_OF_DIGITS == 10) {
		for (let i = start; i < bignum.length; ++i) {
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

	if (start === 1) { string = '-' + string; }
	return string;
};

export const add = (bn_a, bn_b) => {
	let a_neg = bn_a.length > 0 && bn_a.charAt(0) === '-';
	let b_neg = bn_b.length > 0 && bn_b.charAt(0) === '-';

	if (a_neg && ! b_neg) { return sub(bn_b, bn_a.substr(1)); }
	if (! a_neg && b_neg) { return sub(bn_a, bn_b.substr(1)); }

	let start = 0;
	if (a_neg && b_neg) { start = 1; }

	let bn_result = '';
	let carry = 0;

	for (let i = start; i < bn_a.length || i < bn_b.length || carry > 0; ++i) {
		let digit = carry;
		if (i < bn_a.length) { digit += DIGITS.indexOf(bn_a.charAt(i)); }
		if (i < bn_b.length) { digit += DIGITS.indexOf(bn_b.charAt(i)); };
		if (digit >= NUMBER_OF_DIGITS) { digit -= NUMBER_OF_DIGITS; carry = 1; } else { carry = 0; }
		bn_result += DIGITS.charAt(digit);
	}

	if (start == 1) { bn_result = negate(bn_result); }
	return bn_result;
};

export const equals = (bn_a, bn_b) => { return bn_a == bn_b; };

export const less = (bn_a, bn_b) => {
	let a_neg = bn_a.length > 0 && bn_a.charAt(0) === '-';
	let b_neg = bn_b.length > 0 && bn_b.charAt(0) === '-';
	if (a_neg && ! b_neg) { return true; }
	if (! a_neg && b_neg) { return false; }

	let min = (a_neg && b_neg) ? 1 : 0
	for (let i = Math.max(bn_a.length, bn_b.length) - 1; i >= min; --i) {
		const ca = i < bn_a.length ? DIGITS.indexOf(bn_a.charAt(i)) : 0;
		const cb = i < bn_b.length ? DIGITS.indexOf(bn_b.charAt(i)) : 0;
		if (ca < cb) { return true; }
		if (ca > cb) { return false; }
	}
	return false;
};

const err = (message) => { if (console && console.log) { console.log(message); } };

const trim = (bn) => {
	let i;
	const zero = DIGITS.charAt(0);
	for (i = bn.length - 1; i >= 0 && bn.charAt(i) == zero; --i);
	return bn.substring(0, i + 1);
}

export const sub = (bn_a, bn_b) => {
	let a_neg = bn_a.length > 0 && bn_a.charAt(0) === '-';
	let b_neg = bn_b.length > 0 && bn_b.charAt(0) === '-';
	if (a_neg && ! b_neg) { return negate(add(negate(bn_a), bn_b)); }
	if (! a_neg && b_neg) { return add(bn_a, negate(bn_b)); }

	if (a_neg && b_neg) { bn_a = negate(bn_a); bn_b = negate(bn_b); }

	let bn_result = '';
	if (less(bn_a, bn_b)) { 
		const bn_inv = sub(bn_b, bn_a);
		if (a_neg && b_neg) {
			return bn_inv;
		} else {
			return negate(bn_inv);
		}
	}

	let carry = 0;
	for (let i = 0; i < bn_a.length; ++i) {
		let digit = DIGITS.indexOf(bn_a.charAt(i)) + carry;
		if (i < bn_b.length) { digit -= DIGITS.indexOf(bn_b.charAt(i)); }
		if (digit < 0) { digit += NUMBER_OF_DIGITS; carry = -1; } else { carry = 0; }
		bn_result += DIGITS.charAt(digit);
	}
	if (carry < 0) { err('underflow ignoring last carry'); }

	if (a_neg && b_neg) { bn_result = negate(bn_result); }

	return trim(bn_result);
};

const mult_digit = (bignum, digit) => {
	switch (digit) {
		case 0: return '';
		case 1: return trim(bignum);
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

	return trim(bn_product);
};

export const mult = (bn_a, bn_b, bn_mod) => {
	let a_neg = bn_a.length > 0 && bn_a.charAt(0) === '-';
	let b_neg = bn_b.length > 0 && bn_b.charAt(0) === '-';

	if (a_neg) { bn_a = bn_a.substr(1); }
	if (b_neg) { bn_b = bn_b.substr(1); }

	let bn_result = '';
	let prefix = '';
	for (let i = 0; i < bn_a.length; ++i) {
		let bn_part = prefix + mult_digit(bn_b, DIGITS.indexOf(bn_a.charAt(i)));
		bn_result = add(bn_result, bn_part);
		prefix += DIGITS.charAt(0);
	}

	if (a_neg !== b_neg) { bn_result = '-' + bn_result; }
	return mod(bn_result, bn_mod);
};

const div_single = (bn_a, bn_b) => {
	if (bn_b.length <= 0) { err("divide by zero"); return { digit: 0, mod: '' }; }
	if (less(bn_a, bn_b)) { return { digit: 0, mod: bn_a }; }

	for (let digit = NUMBER_OF_DIGITS - 1;; --digit) {
		const bn_value = mult_digit(bn_b, digit);
		if (! less(bn_a, bn_value)) {
			return { digit: digit, mod: sub(bn_a, bn_value) };
		}
	}
}

export const div = (bn_a, bn_b) => {
	let a_neg = bn_a.length > 0 && bn_a.charAt(0) === '-';
	let b_neg = bn_b.length > 0 && bn_b.charAt(0) === '-';

	if (a_neg) { bn_a = negate(bn_a); }
	if (b_neg) { bn_b = negate(bn_b); }

	if (bn_b.length <= 0) { err("divide by zero"); return { result: '', mod: '' }; }

	if (less(bn_a, bn_b)) { 
		if (a_neg !== b_neg) { bn_a = negate(bn_a); }
		return { result: '', mod: bn_a };
	}

	let bn_result = '';
	let cur = '';
	for (let i = bn_a.length - 1; i >= 0; --i) {
		cur = bn_a.charAt(i) + cur;
		const dd = div_single(trim(cur), bn_b);
		if (dd.digit > 0 || bn_result.length > 0) {
			bn_result = DIGITS.charAt(dd.digit) + bn_result;
		}
		cur = dd.mod;
	}

	if (a_neg !== b_neg) { bn_result = negate(bn_result); cur = negate(cur); }
	if (a_neg && b_neg) { cur = negate(cur); }

	return { result : bn_result, mod: cur };
};

export const mod = (bignum, bn_mod) => {
	if (! bn_mod || bn_mod.length <= 0) { return trim(bignum); }
	let result = div(bignum, bn_mod);
	return result.mod;
};

export const pow = (bn_base, bn_exp, bn_mod) => {
	let result = fromNumber(1);
	let two = fromNumber(2);
	while (less('', bn_exp)) {
		const dd = div(bn_exp, two);
		const even = (dd.mod.length > 0) && (DIGITS.indexOf(dd.mod.charAt(0)) % 2 == 1);
		if (even) { result = mult(result, bn_base, bn_mod); }
		bn_base = mult(bn_base, bn_base, bn_mod);
		bn_exp = dd.result;
	}
	return result;
}

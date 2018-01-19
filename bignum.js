let THOUSANDS_SEPARATOR;
const MAX_SLICE = 0xffffffff >>> 0;
const ASCII_ZERO = 48;

const BN_ZERO = { pos: true, value: new Uint32Array() };
const BN_TEN = { pos: true, value: new Uint32Array([10]) };
const BN_SHIFT = { pos:true, value: new Uint32Array([0, 1]) };

export const reconfig = (options) => {
	if (! options) { options = {}; }
	if (! ('thousands_separator' in options)) { options.thousands_separator = ' '; }
	THOUSANDS_SEPARATOR = options.thousands_separator;
}

reconfig();

export const fromNumber = (bn_res, value) => {
	let ui_value = value >>> 0;
	if (value < 0 || value > MAX_SLICE || value != ui_value) { console.log("failed with [" + value + "]"); return null; }

	if (! bn_res) { bn_res = {}; }
	bn_res.pos = true;
	bn_res.value = ui_value ? new Uint32Array([ui_value]) : new Uint32Array();
	return bn_res;
};

export const copy = (bn_res, bn_from) => {
	if (! bn_res) { bn_res = {}; }

	if (bn_res !== bn_from) {
		bn_res.pos = bn_from.pos;
		bn_res.value = new Uint32Array(bn_from.value);
	}
	return bn_res;
}

export const negate = (bn_res, bn_num) => {
	if (! bn_res) { bn_res = {}; }

	bn_res.pos = ! bn_res.pos;
	if (bn_res !== bn_num) {
		bn_res.value = new Uint32Array(bn.value);
	}
	return bn_res;
};

export const abs = (bn_res, bn_num) => {
	if (! bn_res) { bn_res = {}; }

	bn_res.pos = true;
	if (bn_res !== bn_num) {
		bn_res.value = new Uint32Array(bn_num.value);
	}
	return bn_res;
};

export const fromString = (bn_res, string) => {
	bn_res = fromNumber(bn_res, 0);
	bn_res.pos = string.length <= 0 || string.charAt(0) !== '-';

	let bn_idx = BN_ZERO;

	for (let i = 0; i < string.length; ++i) {
		const idx = string.charCodeAt(i) - ASCII_ZERO;
		if (idx > 9 || idx < 0 || (idx === 0 && equals(bn_res, BN_ZERO))) { continue; }
		mult(bn_res, BN_TEN);
		add(bn_res, fromNumber(bn_idx, idx));
	}

	return bn_res;
};

export const equals = (bn_a, bn_b) => { 
	if (bn_a.pos != bn_b.pos) { return false; }
	const max = Math.max(bn_a.value.length, bn_b.value.length);
	for (let i = 0; i < max; ++i) {
		const ui_a = i < bn_a.value.length ? bn_a.value[i] : (0 >>> 0);
		const ui_b = i < bn_b.value.length ? bn_b.value[i] : (0 >>> 0);
		if (ui_a !== ui_b) { return false; }
	}
	return true;
};

export const abs_less = (bn_a, bn_b) => {
	const max = Math.max(bn_a.value.length, bn_b.value.length);
	for (let i = max - 1; i >= 0; --i) {
		const ca = i < bn_a.length ? bn_a.value[i] : (0 >>> 0);
		const cb = i < bn_b.length ? bn_b.value[i] : (0 >>> 0);
		if (ca < cb) { return true; }
		if (ca > cb) { return false; }
	}
	return false;
}

export const less = (bn_a, bn_b) => {
	if (bn_a.pos && ! bn_b.pos) { return false; }
	if (! bn_a.pos && bn_b.pos) { return true; }

	if (! bn_a.pos && ! bn_b.pos) {
		negate(bn_a, bn_a); negate(bn_b, bn_b);
		const res = less(bn_b, bn_a);
		negate(bn_b, bn_b); negate(bn_a, bn_a);
		return res;
	}

	return abs_less(bn_a, bn_b);
};

export const toString = (bn_num) => {
	if (! bn_num || bn_num.value.length <= 0) { return '0'; }

	let res = '';

	let cur = abs(null, bn_num);
	let mod = {};

	console.log("cur == " + cur.value);

	const DIGITS = "0123456789";

	for (let i = 0; ! equals(BN_ZERO, cur); ++i) {
		if (i % 3 == 0 && i > 0) { res = THOUSANDS_SEPARATOR + res; }
		div(cur, mod, cur, BN_TEN);
		res = (mod.value.length ? DIGITS.charAt(mod.value[0]) : '0') + res;
	}

	return bn_num.pos ? res : ('-' + res);
};

export const add = (bn_res, bn_a, bn_b) => {
	if (! bn_a.pos && bn_b.pos) { 
		if (bn_res === bn_b) { bn_b = copy(null, bn_b); }
		bn_res = negate(bn_res, bn_a);
		return sub(bn_res, bn_b, bn_res);
	}
	if (bn_a.pos && ! bn_b.pos) {
		if (bn_res === bn_a) { bn_a = copy(null, bn_a); }
		bn_res = negate(bn_res, bn_b);
		return sub(bn_res, bn_a, bn_res); 
		}

	if (bn_res === bn_a) { bn_a = copy(null, bn_a); }
	if (bn_res === bn_b) { bn_b = copy(null, bn_b); }

	let res = [];

	let carry = 0 >>> 0;
	let max = Math.max(bn_a.value.length, bn_b.value.length);
	for (let i = 0; i < max || carry > 0; ++i) {
		let slice = carry;
		let room = MAX_SLICE - slice;
		carry = 0 >>> 0;
		if (i < bn_a.value.length) {
			const ui_a = bn_a.value[i];
			if (room >= ui_a) {
				slice += ui_a;
				room -= ui_a;
			} else {
				++carry;
				slice = (slice + ui_a) >>> 0;
				room = MAX_SLICE - slice;
			}
		}
		if (i < bn_b.value.length) {
			const ui_b = bn_b.value[i];
			if (room >= ui_b) {
				slice += ui_b;
				room -= ui_b;
			} else {
				++carry;
				slice = (slice + ui_b) >>> 0;
				room = MAX_SLICE - slice;
			}
		}
		res.push(slice);
	}

	bn_res = copy(bn_res, BN_ZERO);
	bn_res.pos = bn_a.pos;
	bn_res.value = new Uint32Array(res.reverse());
	return bn_res;
};


const err = (message) => { if (console && console.log) { console.log(message); } };

const trim = (bn) => {
	let i;
	for (i = bn.value.length - 1; i >= 0 && bn.value[i] == 0; --i) {};
	if (i < bn.value.length - 1) { bn.value = bn.value.subarray(0, i + 1); }
	return bn;
}

export const sub = (bn_res, bn_a, bn_b) => {
	if (! bn_a.pos && bn_b.pos) {
		if (bn_res === bn_b) { bn_b = copy(null, bn_b); }
		bn_res = negate(bn_res, bn_a);
		bn_res = add(bn_res, bn_b);
		return negate(bn_res, bn_res);
	}
	if (bn_a.pos && ! bn_b.pos) { 
		if (bn_res === bn_a) { bn_a = copy(null, bn_a); }
		bn_res = negate(bn_res, bn_b);
		return add(bn_res, bn_a, bn_res);
	}

	if (bn_res === bn_a) { bn_a = copy(null, bn_a); }
	if (bn_res === bn_b) { bn_b = copy(null, bn_b); }

	if (less(bn_a, bn_b)) { 
		bn_res = sub(bn_res, bn_b, bn_a);
		return negate(bn_res, bn_res);
	}

	let carry = 0;
	let res = [];

	for (let i = 0; i < bn_a.value.length; ++i) {
		let slice = bn_a.value[i];
		if (slice >= carry) {
			slice -= carry;
			carry = 0;
		} else {
			slice = MAX_SLICE - slice - (carry - 1);
			carry = 1;
		}

		if (i < bn_b.value.length) {
			const ui_b = bn_b.value[i];
			if (slice >= ui_b) {
				slice -= ui_b;
			} else {
				slice = MAX_SLICE - slice - (ui_b - 1);
				++carry;
			}
		}

		res.push(slice);
	}
	if (carry) { err('underflow ignoring last carry'); }

	if (! bn_res) { bn_res = {}; }
	bn_res.pos = bn_a.pos;
	bn_res.value = new Uint32Array(res.reverse());
	console.log("trim 1");
	return trim(bn_res);
};

const mult_digit = (bn_res, bn_a, ui_b) => {
	switch (ui_b) {
		case 0: return copy(bn_res, BN_ZERO);
		case 1: 
			console.log("trim 2");
			return trim(bn_a);
		default: break;
	}

	if (bn_res === bn_a) { bn_a = copy(null, bn_a); }
	bn_res = copy(bn_res, BN_ZERO);

	let carry = 0;
	/*
	for (let i = 0; i < bna_value.length || carry; ++i) {
		let ui_slice = carry;
		carry = 0;

		if (i < bignum.length) { 
			simple_product += digit * DIGITS.indexOf(bignum.charAt(i));
		}
		bn_product += DIGITS.indexOf(simple_product % NUMBER_OF_DIGITS);
		carry = Math.trunc(simple_product / NUMBER_OF_DIGITS);
	}
*/
			console.log("trim 3");
	return trim(bn_res);
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

const div_single = (bn_mod, bn_a, bn_b) => {
	if (equals(bn_b, BN_ZERO)) { err("divide by zero"); return null; }
	if (less(bn_a, bn_b)) { copy(bn_mod, bn_a); return 0; }

	let ui_min = 0 >>> 0;
	let ui_max = MAX_SLICE;
	let ui_candidate;
	let bn_candidate = null;

	while (ui_min < ui_max) {
		const ui_range = ui_max - ui_min;
		ui_candidate = ui_min + (ui_range >> 1);
		bn_candidate = mult_digit(bn_candidate, bn_b, ui_candidate);
		if (equals(bn_candidate, bn_a)) { 
			copy(bn_mod, BN_ZERO); return ui_candidate; 
		} else if (less(bn_candidate, bn_a)) {
			ui_min = ui_candidate;
		} else {
			ui_max = ui_candidate - 1;
		}

	}
	copy(bn_mod, bn_candidate);
	return ui_min; 
}

const shift = (bn) => {
	if (! equals(bn, BN_ZERO)) {
		let array = bn.value.values();
		array.push(0 >>> 0);
		bn.value = new Uint32Array(array);
	}	
	return bn;
}

export const div = (bn_res, bn_mod, bn_a, bn_b) => {
	if (! bn_res) { bn_res = {}; }

	const res_pos = (bn_a.pos == bn_b.pos);

	if (bn_res === bn_a || bn_mod === bn_a) { bn_a = copy({}, bn_a); }
	if (bn_res === bn_b || bn_mod === bn_b) { bn_b = copy({}, bn_b); }

	if (equals(BN_ZERO, bn_b)) { err("divide by zero"); return null; }

	if (abs_less(bn_a, bn_b)) {
		copy(bn_res, BN_ZERO);
		if (res_pos == bn_a.bos) {
			copy(bn_mod, bn_a);
		} else {
			negate(bn_mod, bn_a);
		}
		return bn_res;
	}

	bn_mod = copy(bn_mod, BN_ZERO);
	let bn_small = null;

	let res = [];
	for (let i = bn_a.value.length - 1; i >= 0; --i) {
		bn_small = fromNumber(bn_small, bn_a.value[i]);
		shift(bn_mod);
		add(bn_mod, bn_mod, bn_small);
		const ui_digit = div_single(bn_mod, bn_mod, bn_b);
		if (ui_digit > 0 || res.length) {
			res.push(ui_digit);
		}
	}

	if (! bn_res) { bn_res = {}; }
	console.log("div [" + bn_res + "]");
	bn_res.pos = res_pos;
	bn_res.value = new Uint32Array(res.reverse());
	return bn_res;
};

export const mod = (bignum, bn_mod) => {
	if (! bn_mod || bn_mod.length <= 0) {
		console.log("trim 5");
		return trim(bignum); 
	}
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

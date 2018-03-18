let THOUSANDS_SEPARATOR;
const MAX_SLICE = 0xffffffff >>> 0;
const ASCII_ZERO = 48;

const BN_ZERO = { pos: true, value: new Uint32Array() };
const BN_TEN = { pos: true, value: new Uint32Array([10]) };
const BN_SHIFT = { pos:true, value: new Uint32Array([0, 1]) };

export const reconfig = (options) => {
	if (! options) { options = {}; }
	if (! ('thousands_separator' in options)) { 
		options.thousands_separator = ' ';
	}
	THOUSANDS_SEPARATOR = options.thousands_separator;
}

reconfig();

export const fromNumber = (bn_res, value) => {
	let pos = (value >= 0);
	if (! pos) { value = Math.abs(value); }
	let ui_value = value >>> 0;
	if (value > MAX_SLICE || value != ui_value) { 
		err("failed with [" + value + "]");
		return null; 
	}

	if (! bn_res) { bn_res = {}; }
	bn_res.pos = pos;
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

	bn_res.pos = ! bn_num.pos;
	if (bn_res !== bn_num) {
		bn_res.value = new Uint32Array(bn_num.value);
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
	let res_is_zero = true;
	let res_is_pos = string.length <= 0 || string.charAt(0) !== '-';

	let bn_idx = null;
	for (let i = 0; i < string.length; ++i) {
		const idx = string.charCodeAt(i) - ASCII_ZERO;
		if (idx > 9 || idx < 0 || (idx === 0 && res_is_zero)) { 
			continue; 
		}
		if (res_is_zero) {
			res_is_zero = false;
			bn_res = fromNumber(bn_res, idx);
		} else {
			mult_digit(bn_res, bn_res, 10);
			bn_idx = fromNumber(bn_idx, idx);
			add(bn_res, bn_res, bn_idx);
		}
	}

	if (res_is_zero) {
		bn_res = copy(bn_res, BN_ZERO);
	} else if (! res_is_pos) {
		bn_res = negate(bn_res, bn_res);
	}

	return bn_res;
};

export const equals = (bn_a, bn_b) => { 
	const max = Math.max(bn_a.value.length, bn_b.value.length);
	for (let i = 0; i < max; ++i) {
		const ui_a = i < bn_a.value.length ? bn_a.value[i] : (0 >>> 0);
		const ui_b = i < bn_b.value.length ? bn_b.value[i] : (0 >>> 0);
		if (ui_a !== ui_b) { return false; }
	}
	return bn_a.pos === bn_b.pos;
};

export const abs_less = (bn_a, bn_b) => {
	const max = Math.max(bn_a.value.length, bn_b.value.length);
	for (let i = max - 1; i >= 0; --i) {
		const ca = i < bn_a.value.length ? bn_a.value[i] : (0 >>> 0);
		const cb = i < bn_b.value.length ? bn_b.value[i] : (0 >>> 0);
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

	if (bn_res === bn_a) {
		bn_a = copy(null, bn_a);
		if (bn_res === bn_b) { bn_b = bn_a; }
	} else if (bn_res === bn_b) { 
		bn_b = copy(null, bn_b); 
	}

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

	if (! bn_res) { bn_res = {}; }
	bn_res.pos = bn_a.pos;
	bn_res.value = new Uint32Array(res);
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
		bn_res = add(bn_res, bn_res, bn_b);
		return negate(bn_res, bn_res);
	}
	if (bn_a.pos && ! bn_b.pos) { 
		if (bn_res === bn_a) { bn_a = copy(null, bn_a); }
		bn_res = negate(bn_res, bn_b);
		return add(bn_res, bn_a, bn_res);
	}

	if (bn_res === bn_a) { 
		bn_a = copy(null, bn_a);
		if (bn_res === bn_b) { bn_b = bn_a; }
	} else if (bn_res === bn_b) { 
		bn_b = copy(null, bn_b);
	}

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
	bn_res.value = new Uint32Array(res);
	return trim(bn_res);
};


export const mult = (bn_res, bn_a, bn_b, bn_mod) => {
	if (equals(bn_a, BN_ZERO) || equals(bn_b, BN_ZERO)) {
		return copy(bn_res, BN_ZERO);
	}

	if (bn_res === bn_a) {
		bn_a = copy(null, bn_a);
		if (bn_res === bn_b) { bn_b = bn_a; }
	} else if (bn_res === bn_b) { 
		bn_b = copy(null, bn_b);
	}

	if (! bn_res) { bn_res = {}; }
	bn_res.pos = bn_a.pos === bn_b.pos;
	const a_len = bn_a.value.length;
	const b_len = bn_b.value.length;
	bn_res.value = new Uint32Array(a_len * b_len);

	for (let i = 0; i < a_len; ++i) {
		const ui_a = bn_a.value[i];
		if (! ui_a) { continue; }

		let k = 0 >>> 0;
		const hi_a = ui_a >>> 16;
		const li_a = ui_a & 0xffff;

		let w = i;
		for (let j = 0; k != 0 || j < b_len; ++j, ++w) {
			const ui_b = j < b_len ? bn_b.value[j] : 0 >>> 0;
			const hi_b = ui_b >>> 16;
			const li_b = ui_b & 0xffff;

			const hi_k = k >>> 16;
			const li_k = k & 0xffff;

			const ui_w = bn_res.value[w];
			const hi_w = ui_w >>> 16;
			const li_w = ui_w & 0xffff;

			let li_res = li_a * li_b;
			let mi_res = hi_a * li_b + li_a * hi_b;
			let hi_res = hi_a * hi_b;
			hi_res += mi_res >>> 16;
			mi_res = mi_res & 0xffff;
			mi_res += li_res >>> 16;
			li_res = li_res & 0xffff;

			li_res += li_w + li_k;
			mi_res += li_res >>> 16;
			li_res = li_res & 0xffff;
			mi_res += hi_w + hi_k;
			hi_res += mi_res >>> 16;
			mi_res = mi_res & 0xffff;

			bn_res.value[w] = (mi_res << 16) + li_res;
			k = hi_res;
		}
	}

	return mod(bn_res, bn_res, bn_mod);
};

const mult_digit = (bn_res, bn_a, ui_b) => {
	switch (ui_b) {
		case 0: return copy(bn_res, BN_ZERO);
		case 1: return copy(bn_res, bn_a);
	}

	if (bn_res === bn_a) { bn_a = copy(null, bn_a); }

	const lo_digit = ui_b & 0xffff;
	const hi_digit = ui_b >> 16;

	let lo_res = [];
	let hi_res = [];

	let lo_carry = 0 >>> 0;
	let hi_carry = 0 >>> 0;
	let ui_slice = 0 >>> 0;
	let hi_hi_slice = 0 >>> 0;

	for (let i = 0; i < bn_a.value.length || lo_carry || hi_carry; ++i) {
		const ui_a = i < bn_a.value.length ? bn_a.value[i] : 0;
		const lo_a = ui_a & 0xffff;
		const hi_a = ui_a >>> 16;

		ui_slice = lo_a * lo_digit + lo_carry;
		const lo_lo_slice = ui_slice & 0xffff;
		lo_carry = ui_slice >>> 16;
		ui_slice = hi_a * lo_digit + lo_carry;
		const lo_hi_slice = ui_slice & 0xffff;
		lo_carry = ui_slice >>> 16;
		lo_res.push((lo_hi_slice << 16) | lo_lo_slice);

		ui_slice = lo_a * hi_digit + hi_carry;
		const hi_lo_slice = ui_slice & 0xffff;
		hi_carry = ui_slice >>> 16;
		hi_res.push((hi_lo_slice << 16) | hi_hi_slice);
		ui_slice = hi_a * hi_digit + hi_carry;
		hi_carry = ui_slice >>> 16;
		hi_hi_slice = ui_slice & 0xffff;
	}

	while (hi_res.length && ! hi_res[lo_res.length - 1]) { hi_res.pop(); }
	while (lo_res.length && ! lo_res[lo_res.length - 1]) { lo_res.pop(); }

	if (! bn_res) { bn_res = {}; }
	bn_res.pos = true;
	bn_res.value = new Uint32Array(lo_res);

	let bn_tmp = { pos: true, value: new Uint32Array(hi_res) };
	return add(bn_res, bn_res, bn_tmp);
};

export const div_single = (bn_mod, bn_a, bn_b) => {
	if (equals(bn_b, BN_ZERO)) { err("divide by zero"); return 0; }
	if (less(bn_a, bn_b)) { copy(bn_mod, bn_a); return 0; }

	let ui_min = 0 >>> 0;
	let ui_max = MAX_SLICE;
	let ui_candidate;
	let bn_candidate = null;

	if (bn_a == bn_mod) { bn_a = copy(null, bn_a); }
	if (bn_b == bn_mod) { bn_b = copy(null, bn_b); }

	while (ui_min < ui_max) {
		const ui_range = ui_max - ui_min;
		ui_candidate = ui_min + (ui_range >>> 1);
		if (ui_candidate === ui_min) { ++ui_candidate; }
		bn_candidate = mult_digit(bn_candidate, bn_b, ui_candidate);
		if (equals(bn_candidate, bn_a)) {
			copy(bn_mod, BN_ZERO); return ui_candidate; 
		} else if (less(bn_candidate, bn_a)) {
			ui_min = ui_candidate;
		} else {
			ui_max = ui_candidate - 1;
		}
	}

	if (ui_min != ui_candidate) {
		bn_candidate = mult_digit(bn_candidate, bn_b, ui_min);
	}

	sub(bn_mod, bn_a, bn_candidate);
	return ui_min; 
}

const shift = (bn, count) => {
	if (! equals(bn, BN_ZERO)) {
		let array = Array.from(bn.value.values());
		for (let i = count; i; --i) {
			array.unshift(0 >>> 0);
		}
		bn.value = Uint32Array.from(array);
	}	
	return bn;
}

export const div = (bn_res, bn_mod, bn_a, bn_b) => {
	if (! bn_res) { bn_res = {}; }

	const res_pos = (bn_a.pos == bn_b.pos);
	const mod_pos = bn_a.pos;

	if (bn_res === bn_a || bn_mod === bn_a) { bn_a = copy({}, bn_a); }
	if (bn_res === bn_b || bn_mod === bn_b) { bn_b = copy({}, bn_b); }

	if (equals(BN_ZERO, bn_b)) { err("divide by zero"); return null; }

	if (abs_less(bn_a, bn_b)) {
		copy(bn_res, BN_ZERO);
		copy(bn_mod, bn_a);
		return bn_res;
	}

	bn_a = bn_a.pos ? bn_a : negate(null, bn_a);
	bn_b = bn_b.pos ? bn_b : negate(null, bn_b);

	bn_mod = copy(bn_mod, BN_ZERO);
	let bn_small = null;

	let res = [];
	for (let i = bn_a.value.length - 1; i >= 0; --i) {
		bn_small = fromNumber(bn_small, bn_a.value[i]);
		bn_mod = shift(bn_mod, bn_mod, 1);
		add(bn_mod, bn_mod, bn_small);
		const ui_digit = div_single(bn_mod, bn_mod, bn_b);
		if (ui_digit > 0 || res.length) {
			res.push(ui_digit);
		}
	}

	if (! bn_res) { bn_res = {}; }
	bn_res.pos = res_pos;
	bn_res.value = new Uint32Array(res.reverse());

	if (! mod_pos) { bn_mod = negate(bn_mod, bn_mod); }
	return bn_res;
};

export const mod = (bn_res, bn_num, bn_mod) => {
	if (! bn_mod || equals(BN_ZERO, bn_mod)) {
		bn_res = copy(bn_res, bn_num);
		return trim(bn_res); 
	}
	if (! bn_res) { bn_res = {}; }
	div(null, bn_res, bn_num, bn_mod);
	return bn_res
};

export const pow = (bn_res, bn_base, bn_exp, bn_mod) => {
	bn_base = copy(null, bn_base); 
	bn_exp = copy(null, bn_exp);

	bn_res = fromNumber(bn_res, 1);
	let bn_two = fromNumber(null, 2);
	let bn_mod_two = {};
	while (less(BN_ZERO, bn_exp)) {
		bn_exp = div(bn_exp, bn_mod_two, bn_exp, bn_two);
		const even = bn_mod_two.value.length && bn_mod_two.value[0] == 1;
		if (even) { bn_res = mult(bn_res, bn_res, bn_base, bn_mod); }
		bn_base = mult(bn_base, bn_base, bn_base, bn_mod);
	}
	return bn_res;
}

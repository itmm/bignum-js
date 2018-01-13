import * as bn from "./bignum";

jQuery(($) => {
	const $prime1 = $('#prime-1');
	const $prime2 = $('#prime-2');
	const $public_key = $('#public-key');
	const $private_key = $('#private-key');
	const $phi = $('#phi');
	const $gcd = $('#gcd');
	const $e = $('#base');
	const $private_message = $('#private-message');
	const $public_message = $('#public-message');
	const $direction = $('#direction');

	let encrypt = true;

	const gcd = (bn_a, bn_b) => {
		let bn_ca = bn_a;
		let bn_cb = bn_b;

		let bn_u = bn.fromNumber(1);
		let bn_s = '';
		let bn_v = bn_s;
		let bn_t = bn_u;

		let count = 0;

		while (bn_cb.length) {
			if (++count >= 100) { alert("failed"); break; }

			const dd = bn.div(bn_ca, bn_cb);
			const bn_na = bn_cb;

			const bn_nb = dd.mod;
			const bn_nu = bn_s;
			const bn_nv = bn_t;
			const bn_ns = bn.sub(bn_u, bn.mult(dd.result, bn_s));
			const bn_nt = bn.sub(bn_v, bn.mult(dd.result, bn_t));

			bn_ca = bn_na;
			bn_cb = bn_nb;
			bn_u = bn_nu;
			bn_v = bn_nv;
			bn_s = bn_ns;
			bn_t = bn_nt;
		}

		return { a: bn_ca, u: bn_u, v: bn_v, s: bn_s, t: bn_t };
	};

	const refresh = () => {
		const bn_prime1 = bn.fromString($prime1.val());
		const bn_prime2 = bn.fromString($prime2.val());
		const public_key = bn.mult(bn_prime1, bn_prime2);
		$public_key.text(bn.toString(public_key));
		const one = bn.fromNumber(1);
		const phi = bn.mult(bn.sub(bn_prime1, one), bn.sub(bn_prime2, one));
		$phi.text(bn.toString(phi));
		const e = bn.fromString($e.val());
		const gg = gcd(phi, e);
		$gcd.text(bn.toString(gg.a));
		const private_key = gg.v;
		$private_key.text(bn.toString(private_key));

		if (encrypt) {
			const source = bn.fromString($private_message.val());
			const encrypted = bn.pow(bn.mod(source, public_key), e, public_key);
			$public_message.val(bn.toString(encrypted));
		} else {
			const source = bn.fromString($public_message.val());
			const decrypted = bn.pow(bn.mod(source, public_key), private_key, public_key);
			$private_message.val(bn.toString(decrypted));
		}
	};

	const setEncrypt = (new_encrypt) => {
		if (encrypt === new_encrypt) { return; }
		encrypt = new_encrypt;
		if (encrypt) {
			$direction.removeClass('flip');
			$direction.addClass('flop');
		} else {
			$direction.removeClass('flop');
			$direction.addClass('flip');
		}
	};

	let timer;

	const queueRefresh = (event) => {
		event.preventDefault();
		if (timer) { clearTimeout(timer); }
		timer = setTimeout(refresh, 500);

		$public_key.text('...');
		$phi.text('...');
		$gcd.text('...');
		$private_key.text('...');

		if (encrypt) {
			$public_message.val('...');
		} else {
			$private_message.val('...');
		}
	}

	$prime1.on('input', queueRefresh);
	$prime2.on('input', queueRefresh);
	$e.on('input', queueRefresh);
	$private_message.on('input', (event) => { setEncrypt(true); queueRefresh(event); });
	$public_message.on('input', (event) => { setEncrypt(false); queueRefresh(event); });
	refresh();
});

import * as bn from "./bignum";

window.addEventListener('load', (event) => {
	window.bn = bn;
	let failures = 0;

	const $tables = document.getElementsByTagName('TABLE');
	for (let i = 0; i < $tables.length; ++i) {
		const $table = $tables[i];
		const $rows = $table.getElementsByTagName('TR');
		for (let j = 0; j < $rows.length; ++j) {
			const $row = $rows[j];
			const $cells = $row.getElementsByTagName('TD');
			if ($cells && $cells.length == 3) {
				const $code = $cells[0];
				const $got = $cells[1];
				const $expected = $cells[2];

				bn.reconfig();
				const code = $code.innerText;
				const got = eval(code);
				$got.appendChild(document.createTextNode(got));

				if (got == $expected.innerText) {
					$row.classList.add('ok');
				} else {
					$row.classList.add('failed');
					++failures;
				}
			}
		}
	}

	document.getElementsByTagName('BODY')[0].classList.add(
		failures > 0 ? 'something-failed' : 'all-passed'
	);
});

import dbc from '../src/index';
import { writeFile } from 'fs';
new dbc().parse('test/abc.dbc', (obj) => {
	writeFile('test.json', JSON.stringify(obj), () => {
		console.log('write file ok!!!');
	});
	//console.log(r);
});

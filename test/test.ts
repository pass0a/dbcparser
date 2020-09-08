import dbc from '../src/index';
import { writeFile } from 'fs';
new dbc().parse('./test/abc.dbc', (obj) => {
	console.log(obj);
});

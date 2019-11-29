import dbc from '../src/index';
import { writeFile } from 'fs';
new dbc().parse('C:/Users/huangzepeng/Desktop/20180821_SU2_2019______18.08.01.dbc', (obj) => {
	writeFile('C:/Users/huangzepeng/Desktop/123.json', JSON.stringify(obj), () => {
		console.log('write file ok!!!');
	});
	//console.log(r);
});

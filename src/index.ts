import { createReadStream, readFileSync, createWriteStream } from 'fs';
enum PS {
	idle,
	ns_,
	string
}
export default class dbc {
	obj: any = {};
	state = PS.idle;
	tmpObject: any = {};
	tmpLine: string = '';
	tmpStr: string = '';
	id: string = '';
	line_num = 0;
	word: string[] = [];
	constructor() {
		this.obj.messages = {};
		this.obj.NS_ = [];
		this.obj.BU_ = [];
		this.obj.annotation = {};
		this.obj.types = {};
		this.obj.value = {};
	}
	parseVersion(word: string[]) {
		this.obj.version = word[1];
		return;
	}
	parseNS_(word: string[]) {
		this.state = PS.ns_;
		for (const iterator of word.slice(1)) {
			this.obj.NS_.push(iterator);
		}
		return;
	}
	parseBS_(word: string[]) {
		/// 波特率定义
		this.state = PS.idle;
	}
	parseBU_(word: string[]) {
		/// 网络节点的定义

		this.state = PS.idle;
		for (const iterator of word.slice(1)) {
			this.obj.BU_.push(iterator);
		}
	}
	parseBO_(word: string[]) {
		/// 报文帧的定义
		this.tmpObject = {};
		if (word.length == 5) {
			this.id = word[1];
			this.tmpObject.name = word[2];
			this.tmpObject.dlc = word[3];
			this.tmpObject.signals = [];
		} else {
			console.log(this.line_num, word);
		}
		this.obj.messages[this.id] = this.tmpObject;
	}
	parseSG_(word: string[]) {
		/// 信号的定义
		/// SG_ SignalName : StartBit|SignalSize@ByteOrder ValueType (Factor,Offset) [Min|Max] Unit Receiver
		if (word.length == 7) {
			let x = /(\d*)\|(\d*)@(\d*)(\+|\-)/i.exec(word[2]);
			let y = /\(([-+]?\d+\.?\d*),([-+]?\d+\.?\d*)\)/i.exec(word[3]);
			let z = /\[([-+]?\d+\.?\d*)\|([-+]?\d+\.?\d*)\]/i.exec(word[4]);

			if (x && y && z) {
				let tmp = {
					name: word[1],
					startbit: +x[1],
					bitlength: +x[2],
					endianess: +x[3] ? 'intel' : 'motorola',
					valuetype: x[4],
					factor: +y[1],
					offset: +y[2],
					min: +z[1],
					max: +z[2],
					unit: word[5],
					receiver: word[6]
				};
				this.tmpObject.signals.push(tmp);
			} else {
				console.log(x, y, z);
			}
		}
	}
	parseCM_BO_(word: string[]) {
		this.tmpObject = {};
		if (word.length > 3) {
			this.id = word[2];
			this.tmpObject.info = word[3];
			//this.tmpObject.type = word[1];
			this.tmpObject.signals = {};
			this.obj.annotation[this.id] = this.tmpObject;
		} else {
			console.log(this.line_num, word);
		}
	}
	parseCM_SG_(word: string[]) {
		//console.log(word);
		if (word.length > 4) {
			this.tmpObject.signals[word[3]] = word[4];
		}
	}
	parseCM_(word: string[]) {
		switch (word[1].toLowerCase()) {
			case 'bo_':
				this.parseCM_BO_(word);
				break;
			case 'sg_':
				this.parseCM_SG_(word);
				break;
			case 'bu_':
				break;
			default:
				break;
		}
	}
	parseBA_(word: string[]) {}
	parseBA_DEF_(word: string[]) {
		// this.tmpObject = {};
		// if (word.length > 3) {
		// 	this.id;
		// 	this.tmpObject[word[3]] = word[4];
		// 	this.obj.types[this.id] = this.tmpObject;
		// }
	}
	parseBA_DEF_DEF_(word: string[]) {}
	parseVAL_(word: string[]) {
		this.tmpObject = {};
		if (word.length > 4) {
			this.id = word[2];
			this.tmpObject.msgId = +word[1];
			this.tmpObject.list = {};
			for (let index = 3; index + 1 < word.length; index += 2) {
				this.tmpObject.list[word[index]] = word[index + 1];
			}
			this.obj.value[this.id] = this.tmpObject;
		}
	}
	parseOther(word: string[]) {
		while (1) {
			switch (this.state) {
				case PS.idle:
					break;
				case PS.ns_:
					if (word.length == 1) {
						this.obj.NS_.push(word[0]);
					} else {
						this.state = PS.idle;
						continue;
					}
					break;
			}
			break;
		}
	}
	split(line: string) {
		///todo 不考虑字符串中包含\"的情况
		for (let index = 0; index < line.length; index++) {
			const element = line[index];
			switch (element) {
				case ' ':
				case ':':
				case '\t':
					if (this.state != PS.string) {
						if (this.tmpStr.length) {
							this.word.push(this.tmpStr);
							this.tmpStr = '';
						}
					} else {
						this.tmpStr += element;
					}
					break;
				case '"':
					if (this.state == PS.string) {
						this.word.push(this.tmpStr);
						this.tmpStr = '';
						this.state = PS.idle;
					} else {
						this.state = PS.string;
					}
					break;
				case '\r':
				case '\n':
					if (this.state != PS.string) {
						if (this.tmpStr.length) {
							this.word.push(this.tmpStr);
							this.tmpStr = '';
						}
						break;
					}
				default:
					this.tmpStr += element;
					break;
			}
		}
		console.log(this.state, line);
		if (this.state == PS.string) {
			this.tmpStr += '\n';
			return false;
		}
		return true;
	}

	dispatch(word: string[]) {
		if (this.state == PS.ns_) {
			this.parseOther(word);
		} else if (this.state == PS.idle) {
			switch (word[0].toLowerCase()) {
				case 'version':
					return this.parseVersion(word);
				case 'ns_':
					return this.parseNS_(word);
				case 'bs_':
					return this.parseBS_(word);
				case 'bu_':
					return this.parseBU_(word);
				case 'bo_':
					return this.parseBO_(word);
				case 'sg_':
					return this.parseSG_(word);
				case 'cm_':
					return this.parseCM_(word);
				case 'ba_def_':
					return this.parseBA_DEF_(word);
				case 'ba_def_def_':
					return this.parseBA_DEF_DEF_(word);
				case 'val_':
					return this.parseVAL_(word);
				default:
					return this.parseOther(word);
			}
		} else {
			///error!!!
		}
	}
	parseString(data: string) {
		if (this.tmpLine.length) {
			data = this.tmpLine + data;
			this.tmpLine = '';
		}
		let lines = data.split('\n');
		if (!data.endsWith('\n')) {
			let tmp = lines.pop();
			if (tmp) this.tmpLine = tmp;
		}
		for (let index = 0; index < lines.length; index++) {
			this.line_num++;
			const line = lines[index];
			if (this.split(line)) {
				if (this.word.length) {
					this.dispatch(this.word);
					this.word = [];
				}
			}
		}
	}
	parse(path: string, cb: (obj: any) => void): void;
	parse(path: string, encoding: string, cb: (obj: any) => void): void;
	parse(path: string, encoding: any, cb?: any) {
		if (typeof encoding == 'function') {
			cb = encoding;
			encoding = 'utf8';
		}
		let c = createReadStream(path, encoding);
		c.on('data', (data) => {
			this.parseString(data);
		});
		c.on('end', () => {
			cb(this.obj);
		});
	}
}

	// "use strict";
	// var http = require("http");
	// const fs = require("fs");

	// http.createServer(function (request, response) {
	//    response.writeHead(200, {'Content-Type': 'text/plain'});
	//    response.end('Hello World\n');
	// }).listen(8081);

	// console.log('Server running at http://127.0.0.1:8081/');

const dataset = "Ensolarado,Quente,Alta,Nao,N\nEnsolarado,Quente,Alta,Sim,N\nNublado,Quente,Alta,Nao,P\nChuvoso,Media,Alta,Nao,P\nChuvoso,Fria,Normal,Nao,P\nChuvoso,Fria,Normal,Sim,N\nNublado,Fria,Normal,Sim,P\nEnsolarado,Media,Alta,Nao,N\nEnsolarado,Fria,Normal,Nao,P\nChuvoso,Media,Normal,Nao,P\nEnsolarado,Media,Normal,Sim,P\nNublado,Media,Alta,Sim,P\nNublado,Quente,Normal,Nao,P\nChuvoso,Media,Alta,Sim,N";
const tabela = [];
const types = [
	["Ensolarado", "Nublado", "Chuvoso"],
	["Quente", "Media", "Fria"],
	["Normal", "Alta"],
	["Nao", "Sim"],
	["P", "N"]
];
const attrNms = ["Tempo", "Temperatura", "Umidade", "Ventando"];
const attrTypes = ["t1", "t2", "u", "v"];
let raiz = {};
 

function node(nome, attrs) {
	const i = attrNms.findIndex(el => el == nome);
	const res = {nome: nome, index: i, attrs: attrs};
	res.ramos = [];
	attrs.forEach((el,i) => {
		pushValue = el.n == 0 && el.p > 0 ? "P" : (el.p == 0 && el.n > 0 ? "N" : null);
		res.ramos.push(pushValue);
	});

	return res;
}

function attribute(pos, neg, nome) {
	return {p: pos, n: neg, s:(pos+neg)};
}

function log(base, x) {
 	return x > 0 ? Math.log(x) / Math.log(base) : 0;
}

function entropia(args){
	return args.reduce((a,b) => -a *log(2,a) + (-b)*log(2,b) );
}

function resto(nodes, sumPN) {
	let sum = 0;
	nodes.forEach((a, ind)=> {
		sum += (a.s/((!sumPN && 1)||sumPN)) * entropia([(a.p/((!a.s&&1)||a.s)), (a.n/((!a.s&&1)||a.s))]);
	});
	return sum;
}


function melhorAttr(tabela, usedTypes) {
	let p=0, n=0;
	let subs = {
		t1:[{p:0,n:0}, {p:0,n:0}, {p:0,n:0}],
		t2:[{p:0,n:0}, {p:0,n:0}, {p:0,n:0}],
		u:[{p:0,n:0}, {p:0,n:0}],
		v:[{p:0,n:0}, {p:0,n:0}]
	};

	tabela.forEach(el => {
		var t1 = types[0].findIndex(t => t == el.t1);
		var t2 = types[1].findIndex(t => t == el.t2);
		var u = types[2].findIndex(t => t == el.u);
		var v = types[3].findIndex(t => t == el.v);

		if(el.c == "P") {
			subs.t1[t1].p++; subs.t2[t2].p++; subs.u[u].p++; subs.v[v].p++; p++;
		} else {
			subs.t1[t1].n++; subs.t2[t2].n++; subs.u[u].n++; subs.v[v].n++; n++;
		}
	});

	subs.t1.forEach(el => el.s = el.p + el.n);
	subs.t2.forEach(el => el.s = el.p + el.n);
	subs.u.forEach(el => el.s = el.p + el.n);
	subs.v.forEach(el => el.s = el.p + el.n);
	console.log("Subconjuntos: ", subs);

	let entp = entropia([p/(p+n),n/(p+n)]);
	let ganhos = [
		entp - resto(subs.t1,p+n),
		entp - resto(subs.t2,p+n),
		entp - resto(subs.u,p+n),
		entp - resto(subs.v,p+n)
	];
	let attrs = [subs.t1, subs.t2, subs.u, subs.v];

	let melhor = 0;
	let mapped = ganhos.map((e,i) => {if(!usedTypes.includes(attrTypes[i])) return e;});
	console.log("Ganhos: ", mapped);
	mapped.forEach((el,i) => {
		el && mapped[melhor] && el > mapped[melhor]? melhor = i : (!mapped[melhor] && el? melhor = i : null);
	});

	return node(attrNms[melhor], attrs[melhor]);
}

// var stop = 3;
function id3(table, rootNode, index, usedTypes) {
	// if(--stop <= 0) return;
	console.log("Used: ",usedTypes);
	console.log("Table: ",table);
	let melhor = melhorAttr(table, usedTypes);
	let no = node(melhor.nome, melhor.attrs);
	let attr = attrTypes[no.index];
	usedTypes.push(attr);

	if(Object.keys(rootNode).length > 0)
		rootNode.ramos[index] = no;
	else
		rootNode = no;

	no.ramos.forEach((e,i)=> {
		let newTable = table.filter(r => r[attr] == types[no.index][i]);
		if(e == null) id3(newTable, no, i, usedTypes);
	});
	console.log("No: ", no);
}

function start() {
	read();
	id3(tabela, raiz, -1, []);
	console.log(raiz);
}

//Leitura dataset
function read() {
	readText(dataset);
}

function registro(tempo,temperatura,umidade,vento,classe) {
	return {t1:tempo, t2:temperatura, u:umidade, v:vento, c:classe};
}

function readDataset(path) {
	let dataset = fs.readFileSync(path, "utf8");
	readText(dataset);
}

function readText(text) {
	text.split("\n").forEach(e => {
		let ele = e.replace(/\r/ig, "").split(",");
		tabela.push(registro(ele[0], ele[1], ele[2], ele[3], ele[4]));
	});
}
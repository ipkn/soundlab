var W = 700;
var H = 500;
var min_life = 10;
var max_life = 60;
var avg_life = (min_life + max_life) / 2;
var avg_note = 5;

var bullets = [];
var notes = [];
var note_range = [26, 88];

var other_users = {};
var user_state = 0;

function dist2(x,y)
{
    return x*x+y*y;
}

var vx = 0;
var vy = 0;
var x = W / 2;
var y = H / 2;
var keys = {}

sc.on('keyup', function(e) {
    if (e.keyCode == 87) {
        keys.w = 0;
        user_state &= ~1;
    } else if (e.keyCode == 65) {
        keys.a = 0;
        user_state &= ~2;
    } else if (e.keyCode == 83) {
        keys.s = 0;
        user_state &= ~4;
    } else if (e.keyCode == 68) {
        keys.d = 0;
        user_state &= ~8;
    }
});
sc.on('keydown', function(e) {
    if (e.keyCode == 87) {
        keys.w = 1;
        user_state |= 1;
    } else if (e.keyCode == 65) {
        keys.a = 1;
        user_state |= 2;
    } else if (e.keyCode == 83) {
        keys.s = 1;
        user_state |= 4;
    } else if (e.keyCode == 68) {
        keys.d = 1;
        user_state |= 8;
    }
});

var cooldown = 300;
var last_fired = Date.now() - cooldown;

function fire(x, y, tx, ty) {
    if (last_fired+cooldown > Date.now())
        return;
    last_fired = Date.now();
    var dx = tx - x;
    var dy = ty - y;
    var l = Math.sqrt(dist2(dx, dy));
    if (l <= 0)
        return;
    dx *= 10/l;
    dy *= 10/l;
	b = [x*1000|0,y*1000|0,x*1000|0,y*1000|0,dx*1000|0,dy*1000|0,Date.now()+50];
	sync('b', b);
    //bullets.push(b);
}

var sock = null;
function sync(type, body) {
	sock.send(JSON.stringify([type, body]));
}

var firing = false;
sc.on('mousedown', function(e) {
	firing = true;
    user_state |= 16;
});
sc.on('mousemove', function(e) {
	mx = e.pageX;
	my = e.pageY;
});
sc.on('mouseup', function(e) {
	firing = false;
    user_state &= ~16;
});

var bar = 20;
var piano_notes = ['G3', 'A3', 'B3',
'C4', 'D4', 'E4', 'F4', 'G4', 'A4', 'B4',
'C5', 'D5', 'E5', 'F5', 'G5', 'A5', 'B5',
'C6', 'D6', 'E6'];
var piano_notes2 =        ['Ab3', 'Bb3', null,
'Db4', 'Eb4', null, 'Gb4', 'Ab4', 'Bb4', null,
'Db5', 'Eb5', null, 'Gb5', 'Ab5', 'Bb5', null,
'Db6', 'Eb6', null];


function between(l, x, r) {
    return l >= x && x >= r ||  l <=x && x <= r;
}

function hittest(x, y, b) {
    for(var i = 0; i < notes.length; i ++) {
        var n = notes[i];
        if (dist2(x-n[0], y-n[1]) < n[2]*n[2]) {
            MIDI.noteOn(0, n[4], 127, 0);
            MIDI.noteOff(0, n[4], 0.25);
            return true;
        }
    }
    for(var i = 0; i < 500/(bar+5); i ++) {
        if (b[7] == 20+i)
            continue;
        if (!piano_notes2[i])
            continue;
        if (between(50, x, 100) && between(5+bar/2+i*(bar+5), y, 5+bar/2+bar+i*(bar+5)))
        {
            MIDI.noteOn(1, MIDI.keyToNote[piano_notes2[i]], 127, 0);
            MIDI.noteOff(1, MIDI.keyToNote[piano_notes2[i]], 0.75);
            b[7] = 20+i;

            return false;
        }
    }
    for(var i = 0; i < 500/(bar+5); i ++)
    {
        if (b[7] == i)
            continue;
        if (between(600, x, 650) && between(5+i*(bar+5), y, 5+bar+i*(bar+5)))
        {
            MIDI.noteOn(1, MIDI.keyToNote[piano_notes[i]], 127, 0);
            MIDI.noteOff(1, MIDI.keyToNote[piano_notes[i]], 0.75);
            b[7] = i;

            return false;
        }
    }
    return false;
}

/*
sc.on('mousemove', function(e) {
    for(var i = 0; i < notes.length; i ++) {
        var n = notes[i];
        if (dist2(e.x-n[0], e.y-n[1]) < n[2]*n[2]) {
            if (n[5] == 0) {
                MIDI.noteOn(0, n[4], 127, 0);
                MIDI.noteOff(0, n[4], 0.25);
                n[5] = 1;
            }

        }
        else
        {
            n[5] = 0;
        }
    }
});
*/

//function gen_note() {
    //notes.push([sc.random(50,W-50), sc.random(50,H-50), sc.random(10,25), Date.now() + sc.random(min_life, max_life)*1000, sc.random(note_range[0], note_range[1]),Date.now()-100]);
//}
//gen_note();
//gen_note();
//gen_note();
function spawn_notes() {
    alives = [];
    for(var i = 0; i < notes.length; i ++) {
        if (notes[i][3] > Date.now()) {
            alives.push(notes[i]);
        }
    }
    notes = alives;
//    var p = avg_note / avg_life / 60;
//    if (Math.random() < p)
//    {
//        gen_note();
//    }
}

var dead = false;
var dead_time = Date.now();

function update_bullets() {
    var nb = [];
    for(var i = 0; i < bullets.length; i ++) {
        var b = bullets[i];
        b[0] = b[2] + b[4] * (Date.now() - b[6])/60;
        b[1] = b[3] + b[5] * (Date.now() - b[6])/60;
        if (!dead && Date.now() - dead_time > 10000 && Date.now() - b[6] > 500 && between(x-8, b[0], x+8) && between(y-8, b[1], y+8)) {
            dead = true;
            dead_time = Date.now();
            sync('d', [identity, b[8]]);
            console.log('x_x');
        }
        if (b[0] >= -5 && b[1] >= -5 && b[0] < W+5 && b[1] < H+5) {
            if (!hittest(b[0], b[1], b))
                nb.push(b);
        }
    }
    bullets = nb;
}

var SYNC_INTERVAL = 300;
var last_sync = Date.now() - SYNC_INTERVAL;
var last_sync_data = {x:-1,y:-1,vx:-1,vy:-1, user_state:-1};



function draw_piano() {
    for(var i = 0; i < 500/(bar+5); i ++)
    {
        if (!piano_notes2[i])
            continue;
        //if (i == 3 || i == 10 || i == 17) {
            sc.rectangle(50, 5+bar/2+i*(bar+5), 50, bar, [0,0,0, 0.5]);
        //}
    }
    for(var i = 0; i < 500/(bar+5); i ++)
    {
        if (i == 3 || i == 10 || i == 17) {
            sc.rectangle(600, 5+i*(bar+5), 50, bar, [100,100,255,1]);
        }
        sc.line(600, 5+i*(bar+5), 650, 5+i*(bar+5), [0,0,0]);
        sc.line(600, 5+bar+i*(bar+5), 650,  5+bar+i*(bar+5), [0,0,0]);
        sc.line(600, 5+i*(bar+5), 600, 5+bar+i*(bar+5), [0,0,0]);
        sc.line(650, 5+i*(bar+5), 650, 5+bar+i*(bar+5), [0,0,0]);

    }
}

function update() {
    spawn_notes();

    if (dead)
        sc.clear([250,200,200]);
    else
        sc.clear();
    draw_piano();

    for(var i = 0; i < notes.length; i ++) {
        var n = notes[i];
        var color_str = md5(n[4]);
        var hex = '0123456789abcdef';
        var c = [
            hex.indexOf(color_str[0])*16+hex.indexOf(color_str[1]),
            hex.indexOf(color_str[2])*16+hex.indexOf(color_str[3]),
            hex.indexOf(color_str[4])*16+hex.indexOf(color_str[5]),
            0.5];
		if (Date.now() - n[5] < 100) {
            c[3] += (100-Date.now() + n[5])/200;
			sc.circle(n[0]+sc.random(-1,1), n[1]+sc.random(-1,1), n[2], c);
		} else {
			sc.circle(n[0], n[1], n[2], c);
		}
    }
    var ax = 0
    var ay = 0
    if (keys.w) ay -= 1
    if (keys.a) ax -= 1
    if (keys.s) ay += 1
    if (keys.d) ax += 1
    vx += ax;
    vy += ay;
    x += vx;
    y += vy;

    vx *= 0.7;
    vy *= 0.7;
    x = Math.round(x*1000)/1000;
    y = Math.round(y*1000)/1000;
    if (Math.abs(vx) < 0.1) vx = 0;
    if (Math.abs(vy) < 0.1) vy = 0;
    vx = Math.round(vx*1000)/1000;
    vy = Math.round(vy*1000)/1000;
    if (x < 0) x = 0;
    if (y < 0) y = 0;
    if (x > W) x = W;
    if (y > H) y = H;
    update_bullets();
    for(var i = 0; i < bullets.length; i ++) {
        sc.circle(bullets[i][0], bullets[i][1], 3, [0,0,0]);
    }
    if (dead)
        sc.text(300, 100, "DEAD", 30, [255,0,0]);
    if (dead && Date.now() - dead_time > 5000)
        dead = false;
    if (dead) {
        var p = 16-(Date.now() - dead_time) / 5000 * 16;
        sc.rectangle(x-8, y-8, 16, 16, [255, 0, 0]);
        sc.rectangle(x-8, y-8, 16, p, [50, 0, 0]);
    } else {
        sc.rectangle(x-8, y-8, 16, 16, [255, 0, 0]);
    }
	if (firing && !dead)	
		fire(x, y, mx, my);
    var kills = [];
    for(var i  in other_users) {
        var o = other_users[i];
        ax = 0
        ay = 0
        if (o.user_state & 1) ay -= 1
        if (o.user_state & 2) ax -= 1
        if (o.user_state & 4) ay += 1
        if (o.user_state & 8) ax += 1
        o.vx += ax;
        o.vy += ay;
        o.x += o.vx;
        o.y += o.vy;
        if (isNaN(o.rx)) o.rx = o.x;
        if (isNaN(o.ry)) o.ry = o.y;
        if (isNaN(o.rx)) { o.rx = o.x = 250; o.vx=0; }
        if (isNaN(o.ry)) { o.ry = o.y = 250; o.vy=0; }
        if (Math.abs(o.vx) < 1) {
            o.rx = o.rx*0.7+o.x*0.3;
        } else {
            o.rx = o.rx*0.9+o.x*0.1;
        }
        if (Math.abs(o.vy) < 1) {
            o.ry = o.ry*0.7+o.y*0.3;
        } else {
            o.ry = o.ry*0.9+o.y*0.1;
        }
        if (o.dead && Date.now() - o.dead_time > 5000)
            o.dead =false;
        if (o.dead) {
            var p = (Date.now() - o.dead_time) / 5000 * 16;
            sc.rectangle(o.rx-8, o.ry-8, 16, 16, [0, 0, 0]);
            sc.rectangle(o.rx-4, o.ry-8, 8, 16, [255, 0, 0]);
            sc.rectangle(o.rx-4, o.ry-8, 8, p, [0, 0, 0]);
        } else {
            //sc.rectangle(x-8, y-8, 16, 16, [255, 0, 0]);
            sc.rectangle(o.rx-8, o.ry-8, 16, 16, [0, 0, 0]);
        }
        o.vx *= 0.7;
        o.vy *= 0.7;
        if (Math.abs(o.vx) < 0.1) o.vx = 0;
        if (Math.abs(o.vy) < 0.1) o.vy = 0;
        o.x = Math.round(o.x*1000)/1000;
        o.y = Math.round(o.y*1000)/1000;
        o.vx = Math.round(o.vx*1000)/1000;
        o.vy = Math.round(o.vy*1000)/1000;
        if (Date.now() - o.last_ping > 3000) {
            kills.push(i);
        }
    }
    for(var i = 0; i < kills.length; i ++)
        delete other_users[kills[i]];
    if (my_score >= 5)
    {
        sc.text(0, 0, "You killed " + my_score + " musicians...", my_score);
    }
    if (Date.now() - last_sync > SYNC_INTERVAL || user_state != last_sync_data.user_state) {
        if (x != last_sync_data.x || y != last_sync_data.y || vx != last_sync_data.vx || vy != last_sync_data.vy || user_state != last_sync_data.user_state || Date.now() - last_sync > SYNC_INTERVAL) {
            var d = {};
            d.x = x;
            d.y = y;
            if (vx != last_sync_data.vx)
                d.vx = vx;
            if (vy != last_sync_data.vy)
                d.vy = vy;
            if (user_state != last_sync_data.user_state)
                d.user_state = user_state;
            d.now = Date.now();
            sync('o', d);
            last_sync_data = {x, y, vx, vy, user_state};
        }
        last_sync = Date.now();
    }
}

var identity = null;
var my_score = 0;

function start() {

    sock = new WebSocket("ws://i.ipkn.me:40080/ws");
    sock.onopen = ()=>{
        console.log('ws open')
        sc.init(W, H);
        sc.mainloop(update);
    }
    sock.onerror = (e)=>{
        console.log('ws error',e)
    }
    sock.onclose = ()=>{
        console.log('ws close')
    }
    sock.onmessage = (e)=>{
        var msg = JSON.parse(e.data);
        if (msg[0] == 'd') {
            var killed = msg[1][0];
            var killer = msg[1][1];
            if (killed in other_users) {
                other_users[killed].dead = true;
                other_users[killed].dead_time = Date.now();
            }
            if (killer in other_users) {
                other_users[killer].score += 1;
            }
            if (killer == identity)
                my_score += 1;
        } else if (msg[0] == 'i') {
            identity = msg[1];
        } else if (msg[0] == 'b') {
            // msg[1] : from
            msg[2][0] /= 1000;
            msg[2][1] /= 1000;
            msg[2][2] /= 1000;
            msg[2][3] /= 1000;
            msg[2][4] /= 1000;
            msg[2][5] /= 1000;
            if (msg[1] in other_users)
                msg[2][6] += other_users[msg[1]].ping;
            msg[2][7] = 0;
            msg[2][8] = msg[1];
            bullets.push(msg[2])
        } else if (msg[0] == 'o') {
            if (!(msg[1] in other_users)) {
                msg[2].rx = msg[2].x || 250;
                msg[2].ry = msg[2].y || 250;
                other_users[msg[1]] = msg[2];
                other_users[msg[1]].ping = Date.now() - other_users[msg[1]].now;
                other_users[msg[1]].score = 0;
            }
            for(var key in msg[2]) {
                //console.log(
                        //other_users[msg[1]].x - msg[2].x, 
                        //other_users[msg[1]].y - msg[2].y, other_users[msg[1]].x, msg[2].x);
                other_users[msg[1]][key] = msg[2][key];
            }
            other_users[msg[1]].last_ping = Date.now();
            var now_ping = Date.now() - other_users[msg[1]].now;
            other_users[msg[1]].ping = now_ping * 0.7 + other_users[msg[1]].ping * 0.3;
            //console.log('ping ', msg[1], other_users[msg[1]].ping);
        } else if (msg[0] == 'n') {
            notes.push(msg[1]);
        }
    }

}
window.onload = function () {
    $("#loading").show();

	MIDI.loadPlugin({
		//soundfontUrl: "http://gleitz.github.io/midi-js-soundfonts/FluidR3_GM/",
		//soundfontUrl: "http://gleitz.github.io/midi-js-soundfonts/FluidR3_GM/",
        soundfontUrl: "/static/soundfont/",
		instruments: ["acoustic_grand_piano", "breath_noise"],
		onprogress: function(state, progress) {
			console.log(state, progress);
		},
		onsuccess: function() {
            $("#loading").hide();
            start();
			var delay = 0; // play one note every quarter second
			var note = 60; // the MIDI note
			var velocity = 127; // how hard the note hits
			// play the note
			MIDI.setVolume(0, 30);
			MIDI.setVolume(1, 30);
            MIDI.setInstrument(0, MIDI.GM.byName["breath_noise"].number);
            MIDI.setInstrument(1, MIDI.GM.byName["acoustic_grand_piano"].number);
            //for(var i = 52; i < 67; i ++)
            //{
			//MIDI.noteOn(0, i, velocity, delay+i-52);
			//MIDI.noteOff(0, i, delay + 0.25+i-52);
            //}
			//MIDI.noteOn(1, 62, velocity, delay+0.1);
			//MIDI.noteOff(1, 62, delay + 0.1+ 0.75);

		}
	});
};

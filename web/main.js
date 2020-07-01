const request = new XMLHttpRequest();
request.open('GET', '/port', false);  // `false` makes the request synchronous
request.send(null);

let loginForm = document.querySelector("form#login");
let msgForm = document.querySelector("form#msg");
const getWs = () => {
    let ws = new WebSocket("ws://" + location.hostname + ":" + request.response);
    ws.onmessage = msgHandler;
    ws.onclose = ws_closed;
    return ws;
};
let ws = getWs();

loginForm.onsubmit = e => {
    e.preventDefault();
    let name = loginForm.name.value;
    ws.send(name);
}
msgForm.onsubmit = e => {
    e.preventDefault();
    let msg = msgForm.msg.value;
    ws.send("MESSAGE|" + msg);
}


function msgHandler(m) {
    m = m.data;
    switch (m) {
        case "NAME_OK":
            loginForm.toggleAttribute("hide", true);
            msgForm.toggleAttribute("hide", false);
            break;
    }
    console.log(m);
}

function ws_closed() {
    loginForm.toggleAttribute("hide", false);
    msgForm.toggleAttribute("hide", true);
    ws = getWs();
}
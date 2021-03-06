/*
WARNING:
    This code is trash.
    Do not use this in any type of education purposes.
    Only for an example of how to not code.
    That is why this exists.

    It's performance is good.
    But that doesn't make the code good.
    Really bad practices.
    All the code in a single file.

    Please do not copy my code if you don't need it.
    But feel free to do that anyways.
    This will run just fine with (I hope) no memory leaks.
    It has unhandled promise rejections which will throw errors in newer versions of NodeJS.

    This code is INTENTIONALLY BAD.
    You can fork it and make it better (not recommended for mental health).
    But please don't read all the code.
    That may damage your computer, eyes, brain cells and sanity.
*/

const path = require("path");
const ws = require("ws");
const express = require("express");
const uuid = require("uuid");

const WS_HOST = process.env.WS_HOST || "0.0.0.0", // Constants with config
    WS_PORT = process.env.WS_PORT || 4565,
    HTTP_HOST = process.env.HTTP_HOST || "0.0.0.0",
    HTTP_PORT = process.env.HTTP_PORT || 3000,
    WS_ONLY = process.env.WS_ONLY || false,
    VERSION = process.env.VERSION || "2.2.0",
    DEBUG = process.env.DEBUG || false;

const users = [];

const validMsg = str => str.length <= 2048 && str.length > 0,
    validName = str => /^[a-zA-Z0-9_-]{3,24}$/.test(str);

function removeUser(id) { // copied from old code
    try {
        let idx = getIndex(id);
        if (idx > -1) {
            users.splice(idx, 1);
            return true;
        } else
            return false;
    } catch {
        return false;
    }
}

function getIndex(val, type = "ID") { // copied from old code
    let idx = users.findIndex(x => (type === "ID" ? x.id : x.name) === val);
    return idx > -1 ? idx : false;
}

function broadcast(msg, silent) { // copied from old code
    (DEBUG && !silent) ? console.log("[B] " + msg) : false;
    users.forEach(async user => user.c.send(msg + "\n"));
}
function sendMsg(name, message) { // no comment
    message = message.toString().trim(); // overengineering
    if (validMsg(message)) { // ok what
        broadcast("MESSAGE|" + name + "|" + message);
        return true;
    } else
        return false;
}

const wsServer = new ws.Server({ // Start WS server
    port: WS_PORT,
    host: WS_HOST
}, () => {
    console.log("WebSockets Server Listening on " + WS_HOST + ":" + WS_PORT);
    setInterval(() => broadcast("LIST_USERS|" + users.map(x => x.name).join(), true), 1000);
});

wsServer.on("connection", c => {
    let i = 0;
    let id = uuid.v4();
    let name;
    let lastMsg = Date.now();
    let logged = false;
    c.send("VERSION|" + VERSION); // send the user the version constant
    c.on("error", err => DEBUG ? console.error(err) : false);

    c.on("message", m => {
        m = m.trim(); // trim the message
        let data = m.split("|"); // message data
        let invalid = false;

        switch (data[0]) {
            case "NAME":
                // user wants to have a name
                if (validName(data[1])) {
                    if (users.findIndex(usr => usr.name === data[1]) > -1) {
                        c.send("NAME_TAKEN");
                        invalid = true;
                    } else {
                        name = data[1]; // name the user in the current scope
                        if (!logged) {
                            users.push({ // add the user to the users list
                                id: id,
                                c: c,
                                name: name
                            });
                            broadcast("USER_JOIN|" + name);
                        } else {
                            let user = users[getIndex(id)]
                            broadcast("NAME_CHANGE|" + user.name + "|" + name);
                            user.name = name;
                        }
                        c.send("NAME_OK");
                        logged = true; // make the client accept packets from the user
                    }
                } else {
                    c.send("INVALID_NAME");
                    invalid = true;
                }
                break;
            case "MESSAGE":
                if (logged) {
                    if (Date.now() > lastMsg + 500) { // check cooldown
                        let msg = data.filter((t, idx) => idx > 0).join("|");
                        if (data.length >= 2 && sendMsg(name, msg)) { // how to make top quality spag- I mean code
                            lastMsg = Date.now(); // where did we sanitize? oh...
                        } else {
                            invalid = true;
                            c.send("WARN_INVALID_MSG");
                        }
                    } else {
                        c.send("WARN_DELAY"); // tell the user that they can only send messages every 500ms
                    }
                } else {
                    c.send("WARN_INVALID_PACKET");
                    invalid = true;
                }
                break;
            default: // do not kick the user for this
                invalid = true;
                c.send("WARN_INVALID_PACKET");
                break;
        }
        (DEBUG && !invalid) ? console.log("[<] " + (name ? name : "?") + " " + m) : false; // only for debugging
    });

    c.on("close", () => {
        // ok user left
        if (name)
            broadcast("USER_LEFT|" + name)
        if (!removeUser(id))
            console.error("Error while removing user with id " + id);
    });
});

if (!WS_ONLY) {
    const app = express();
    app.use(                                        // This
        express.static(                             // Is
            path.resolve(                           // Technically
                path.join(__dirname || ".", "web")  // Useless
            )                                       // And
        )                                           // Bad
    );                                              // Practice

    app.get("/port", (req, res) => res.send(WS_PORT.toString())); // this is 'required'

    app.listen(HTTP_PORT, HTTP_HOST, () => {  // Start HTTP server
        console.log("HTTP Server Listening on " + HTTP_HOST + ":" + HTTP_PORT);
    });
}
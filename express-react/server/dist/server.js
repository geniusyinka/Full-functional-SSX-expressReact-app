"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var _a, _b;
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const dotenv_1 = __importDefault(require("dotenv"));
const cors_1 = __importDefault(require("cors"));
const ethers_1 = require("ethers");
const ssx_server_1 = require("@spruceid/ssx-server");
const path = require('node:path');
const bcrypt = require("bcryptjs"), bodyParser = require("body-parser"), cookieParser = require("cookie-parser"), multer = require("multer"), jwt = require("jsonwebtoken");
dotenv_1.default.config();
const app = (0, express_1.default)();
const port = process.env.PORT || 5000;
const ssx = new ssx_server_1.SSXServer({
    signingKey: process.env.SSX_SIGNING_KEY,
    providers: {
        rpc: {
            service: ssx_server_1.SSXRPCProviders.SSXInfuraProvider,
            network: ssx_server_1.SSXInfuraProviderNetworks.GOERLI,
            apiKey: (_a = process.env.INFURA_API_KEY) !== null && _a !== void 0 ? _a : "",
        },
        metrics: {
            service: 'ssx',
            apiKey: (_b = process.env.SSX_API_TOKEN) !== null && _b !== void 0 ? _b : ""
        },
    }
});
//login
// (A2) EXPRESS + MIDDLEWARE
app.use(multer().array());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
// (B) USER ACCOUNTS - AT LEAST ENCRYPT YOUR PASSWORDS!
// bcrypt.hash("111111", 8, (err, hash) => { console.log(hash); });
// $2a$08$HwENa0B1VJxPGYhzDhNsQeFjYQCf8Pwu6hGG6HJ/yyAhLKOA28AFG
// $2a$08$g0ZKZhiA97.pyda3bsdQx.cES.TLQxxKmbvnFShkhpFeLJTc6DuA6 - og pw
const users = {
    "jon@doe.com": "$2a$08$HwENa0B1VJxPGYhzDhNsQeFjYQCf8Pwu6hGG6HJ/yyAhLKOA28AFG"
};
// (C) JSON WEB TOKEN
// (C1) SETTINGS - CHANGE TO YOUR OWN!
const jwtKey = "007", jwtIss = "yinka", jwtAud = "http://localhost:3000", jwtAlgo = "HS512";
// (C2) GENERATE JWT TOKEN
var jwtSign = email => {
    // (C2-1) RANDOM TOKEN ID
    let char = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789~!@#$%^&_-", rnd = "";
    for (let i = 0; i < 16; i++) {
        rnd += char.charAt(Math.floor(Math.random() * char.length));
    }
    // (C2-2) UNIX NOW
    let now = Math.floor(Date.now() / 1000);
    // (C2-3) SIGN TOKEN
    return jwt.sign({
        iat: now,
        nbf: now,
        exp: now + 3600,
        jti: rnd,
        iss: jwtIss,
        aud: jwtAud,
        data: { email: email } // whatever else you want to put
    }, jwtKey, { algorithm: jwtAlgo });
};
// console.log(jwt.sign.nbf)
// (C3) VERIFY TOKEN
var jwtVerify = (cookies) => {
    if (cookies.JWT === undefined) {
        return false;
    }
    try {
        let decoded = jwt.verify(cookies.JWT, jwtKey);
        // DO WHATEVER EXTRA CHECKS YOU WANT WITH DECODED TOKEN
        // console.log(decoded);
        return true;
    }
    catch (err) {
        return false;
    }
};
// (D) EXPRESS HTTP
// (D1) STATIC ASSETS
app.use("/assets", express_1.default.static(path.join(__dirname, "assets")));
// (D2) HOME PAGE - OPEN TO ALL
app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "/1-home.html"));
});
// (D3) ADMIN PAGE - REGISTERED USERS ONLY
app.get("/admin", (req, res) => {
    if (jwtVerify(req.cookies)) {
        res.sendFile(path.join(__dirname, "/2-admin.html"));
    }
    else {
        res.json({ message: 'you need to login' });
    }
});
// (D4) LOGIN PAGE
app.get("/login", (req, res) => {
    if (jwtVerify(req.cookies)) {
        res.redirect("../admin");
    }
    else {
        res.json({ message: 'login page' });
    }
});
// (D5) LOGIN ENDPOINT
app.post("/in", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    let pass = users[req.body.email] !== undefined;
    if (pass) {
        pass = yield bcrypt.compare(req.body.password, users[req.body.email]);
    }
    if (pass) {
        res.cookie("JWT", jwtSign(req.body.email));
        res.status(200);
        res.send("OK");
    }
    else {
        res.status(201);
        res.send("Invalid user/password");
    }
}));
// (D6) LOGOUT ENDPOINT
app.post("/out", (req, res) => {
    res.clearCookie("JWT");
    res.status(200);
    // res.send("OK");
    res.redirect('/');
});
//end
app.use((0, cors_1.default)({
    origin: 'http://localhost:3000',
    credentials: true,
}));
app.use((0, ssx_server_1.SSXExpressMiddleware)(ssx));
app.get('/', (req, res) => {
    res.send('Express + TypeScript Server');
});
app.get('/userdata', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _c, _d;
    //the below code will return a false message if the user isn't logged in via either method.
    if ((!req.ssx.verified && !jwtVerify(req.cookies))) {
        return res.status(401).json({ success: false, message: 'Unauthorized' });
    }
    //if success message = true for either web3 or web2, load this.
    const data = yield getDataFromNode((_c = req.ssx.siwe) === null || _c === void 0 ? void 0 : _c.address);
    res.json(Object.assign({ success: true, userId: (_d = req.ssx.siwe) === null || _d === void 0 ? void 0 : _d.address, message: 'Some user data, retrieved from a blockchain node the server can access.' }, data));
}));
app.use((req, res) => {
    if (!res.headersSent) {
        res.status(404).json({ message: 'Invalid API route', success: false });
    }
});
app.listen(port, () => {
    console.log(`⚡️[server]: Server is running at http://localhost:${port}`);
});
function getDataFromNode(address) {
    return __awaiter(this, void 0, void 0, function* () {
        if (!address) {
            return {};
        }
        const balanceRaw = yield ssx.provider.getBalance(address);
        const balance = ethers_1.utils.formatEther(balanceRaw);
        const currentBlock = yield ssx.provider.getBlockNumber();
        return { balance, currentBlock };
    });
}
app.get("/api", (req, res) => {
    res.json({ "users": ["userOne", "usersTwo", "userThree"] });
});
// app.listen(5000, () => {console.log('server started!')})

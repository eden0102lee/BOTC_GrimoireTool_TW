#!/usr/bin/env node
process.env.NODE_ENV = process.env.NODE_ENV || "development";
process.env.LOCAL_PLAY = process.env.LOCAL_PLAY || "1";
require("../server/index.js");

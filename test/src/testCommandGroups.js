"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TestModule2 = exports.TestSubCommandGroup1 = exports.TestCommandArea1 = exports.TestModule1 = void 0;
const src_1 = require("../../src");
let TestModule1 = class TestModule1 {
    testCommand1(c, s) {
        return;
    }
};
__decorate([
    (0, src_1.command)("tc1", "first command"),
    __param(0, (0, src_1.channel)()),
    __param(1, (0, src_1.param)("p1", "first param", "STRING", true))
], TestModule1.prototype, "testCommand1", null);
TestModule1 = __decorate([
    (0, src_1.commandGroup)("tcg1")
], TestModule1);
exports.TestModule1 = TestModule1;
let TestCommandArea1 = class TestCommandArea1 {
    testSubCommand1(u, n) {
        return;
    }
};
__decorate([
    (0, src_1.subCommand)("tsc1", "first subcommand"),
    __param(0, (0, src_1.user)()),
    __param(1, (0, src_1.param)("p2", "second param", "NUMBER"))
], TestCommandArea1.prototype, "testSubCommand1", null);
TestCommandArea1 = __decorate([
    (0, src_1.commandArea)(TestModule1, "tca1", "first command area")
], TestCommandArea1);
exports.TestCommandArea1 = TestCommandArea1;
let TestSubCommandGroup1 = class TestSubCommandGroup1 {
    testSubCommand2(u) {
        return;
    }
    testSubCommand3(s) {
        return;
    }
};
__decorate([
    (0, src_1.subCommand)("tsc2", "second subcommand"),
    __param(0, (0, src_1.param)("p3", "third param", "USER"))
], TestSubCommandGroup1.prototype, "testSubCommand2", null);
__decorate([
    (0, src_1.subCommand)("tsc3", "third subcommand"),
    __param(0, (0, src_1.choice)("p42", "fourth param", [{ name: "v1", value: 1 }, { name: "v2", value: 2 }], "NUMBER"))
], TestSubCommandGroup1.prototype, "testSubCommand3", null);
TestSubCommandGroup1 = __decorate([
    (0, src_1.subCommandGroup)(TestCommandArea1, "tscg1", "first subcommand group")
], TestSubCommandGroup1);
exports.TestSubCommandGroup1 = TestSubCommandGroup1;
let TestModule2 = class TestModule2 {
    constructor() {
        this.a = 9;
    }
    testCommand2(n, c, i) {
        return n + this.a;
    }
};
__decorate([
    (0, src_1.command)("tc2", "second command"),
    __param(0, (0, src_1.minmax)("p5", "fifth param", 3, 8, "NUMBER")),
    __param(1, (0, src_1.channelParam)("p6", "sixth param", [2 /* GUILD_VOICE */])),
    __param(2, (0, src_1.choice)("p7", "seventh param", [{ name: "v1", value: "ff" }, { name: "v2", value: "aa" }], "STRING", true))
], TestModule2.prototype, "testCommand2", null);
TestModule2 = __decorate([
    (0, src_1.commandGroup)("tcg2")
], TestModule2);
exports.TestModule2 = TestModule2;
//# sourceMappingURL=testCommandGroups.js.map
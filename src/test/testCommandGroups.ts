import { ChannelTypes } from 'discord.js/typings/enums';

import { command, commandArea, commandGroup, subCommand, subCommandGroup } from '../Decorators/command';
import { channel, channelParam, choice, minmax, param, user } from '../Decorators/parameter';

@commandGroup("tcg1")
export class TestModule1 {
    @command("tc1", "first command")
    public testCommand1(@channel() c: any, @param("p1", "first param", "STRING", true) s: string): void {
        return;
    }
}
@commandArea(TestModule1, "tca1", "first command area")
export class TestCommandArea1 {
    @subCommand("tsc1", "first subcommand")
    public testSubCommand1(@user() u: any, @param("p2", "second param", "NUMBER") n: number): void {
        return;
    }
}

@subCommandGroup(TestCommandArea1, "tscg1", "first subcommand group")
export class TestSubCommandGroup1 {
    @subCommand("tsc2", "second subcommand")
    public testSubCommand2(@param("p3", "third param", "USER") u: any) {
        return;
    }

    @subCommand("tsc3", "third subcommand")
    public testSubCommand3(@choice("p42", "fourth param", [{ name: "v1", value: 1 }, { name: "v2", value: 2 }], "NUMBER") s: string) {// type should be number
        return;
    }
}

@commandGroup("tcg2")
export class TestModule2 {
    public a = 9;

    @command("tc2", "second command")
    public testCommand2(@minmax("p5", "fifth param", 3, 8, "NUMBER") n: number, @channelParam("p6", "sixth param", [ChannelTypes.GUILD_VOICE]) c: any, @choice("p7", "seventh param", [{ name: "v1", value: "ff" }, { name: "v2", value: "aa" }], "STRING", true) i: number) {
        return n + this.a;
    }
}

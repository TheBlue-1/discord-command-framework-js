import { ChannelTypes } from "discord.js/typings/enums";
import {
  Channel,
  ChannelParam,
  Choice,
  Command,
  CommandArea,
  CommandGroup,
  Minmax,
  Param,
  SubCommand,
  SubCommandGroup,
  User,
} from "../../src";

@CommandGroup("tcg1")
export class TestModule1 {
  @Command("tc1", "first command")
  public testCommand1(
    @Channel() c: any,
    @Param("p1", "first param", "STRING", true) s: string
  ) {
    return "success";
  }
}
@CommandArea(TestModule1, "tca1", "first command area")
export class TestCommandArea1 {
  @SubCommand("tsc1", "first subcommand")
  public testSubCommand1(
    @User() u: any,
    @Param("p2", "second param", "NUMBER") n: number
  ) {
    return "success";
  }
}

@SubCommandGroup(TestCommandArea1, "tscg1", "first subcommand group")
export class TestSubCommandGroup1 {
  @SubCommand("tsc2", "second subcommand")
  public testSubCommand2(@Param("p3", "third param", "USER") u: any) {
    return "success";
  }

  @SubCommand("tsc3", "third subcommand")
  public testSubCommand3(
    @Choice(
      "p42",
      "fourth param",
      [
        { name: "v1", value: 1 },
        { name: "v2", value: 2 },
      ],
      "NUMBER"
    )
    s: string
  ) {
    // type should be number
    return "success";
  }
}

@CommandGroup("tcg2")
export class TestModule2 {
  public a = 9;

  @Command("tc2", "second command")
  public testCommand2(
    @Minmax("p5", "fifth param", 3, 8, "NUMBER") n: number,
    @ChannelParam("p6", "sixth param", [ChannelTypes.GUILD_VOICE]) c: any,
    @Choice(
      "p7",
      "seventh param",
      [
        { name: "v1", value: "ff" },
        { name: "v2", value: "aa" },
      ],
      "STRING",
      true
    )
    i: number
  ) {
    return n + this.a;
  }
}

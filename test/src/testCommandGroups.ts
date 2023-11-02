/* eslint-disable @typescript-eslint/class-methods-use-this */
import {
  ApplicationCommandOptionType,
  Author,
  ChannelParam,
  ChannelType,
  Choice,
  Command,
  CommandArea,
  CommandChannel,
  CommandGroup,
  Minmax,
  Param,
  SubCommand,
  SubCommandGroup,
} from "../../src";

@CommandGroup("tcg1")
export class TestModule1 {
  @Command("tc1", "first command")
  public testCommand1(
    @CommandChannel() _c: unknown,
    @Param("p1", "first param", ApplicationCommandOptionType.String, true)
    _s: string,
  ) {
    return "success";
  }
}
@CommandArea(TestModule1, "tca1", "first command area")
export class TestCommandArea1 {
  @SubCommand("tsc1", "first subcommand")
  public testSubCommand1(
    @Author() _u: unknown,
    @Param("p2", "second param", ApplicationCommandOptionType.Number)
    _n: number,
  ) {
    return "success";
  }
}

@SubCommandGroup(TestCommandArea1, "tscg1", "first subcommand group")
export class TestSubCommandGroup1 {
  @SubCommand("tsc2", "second subcommand")
  public testSubCommand2(
    @Param("p3", "third param", ApplicationCommandOptionType.User) _u: unknown,
  ) {
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
      ApplicationCommandOptionType.Number,
    )
    _s: string,
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
    @Minmax("p5", "fifth param", 3, 8, ApplicationCommandOptionType.Number)
    n: number,
    @ChannelParam("p6", "sixth param", [ChannelType.GuildVoice]) _c: unknown,
    @Choice(
      "p7",
      "seventh param",
      [
        { name: "v1", value: "ff" },
        { name: "v2", value: "aa" },
      ],
      ApplicationCommandOptionType.String,
      true,
    )
    _i: number,
  ) {
    return n + this.a;
  }
}

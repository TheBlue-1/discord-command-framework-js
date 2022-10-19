# discord-command-framework-js

This is a simpler library for discord-js.
The idea is to have a NestJs-like experience with Decorators and Controller-like command groups.
Feel free to help by creating prs, issues or joining on [discord](https://discord.gg/dkCPEmr8eb)

```
Pattern:
commandgroup{
command(
attribute,
parameter
)
subcommand(
attribute,
parameter
)
}
subcommandgroup{
subcommand(
attribute,
parameter
)
}
commandarea {
subcommand(
attribute,
parameter
)
}
```

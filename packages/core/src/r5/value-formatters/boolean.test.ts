import { Formatter } from "../formatters";
import { booleanFormatter } from "./boolean";

describe("boolean", () => {
  const formatter = new Formatter().register(booleanFormatter);

  it.each([
    [true, undefined, "yes"],
    [false, undefined, "no"],
    [undefined, undefined, ""],
    [true, { labels: { true: "true" } }, "true"],
    [undefined, { labels: { nil: "nothing" } }, "nothing"],
  ])("format %p %p => %p", (value, options, expected) => {
    expect(formatter.format("boolean", value, options)).toEqual(expected);
  });
});

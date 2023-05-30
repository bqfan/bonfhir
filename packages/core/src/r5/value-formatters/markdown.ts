import { marked } from "marked";
import { ValueFormatter } from "../formatters.js";

/**
 * A FHIR string (see above) that may contain markdown syntax for optional processing
 * by a markdown presentation engine
 *
 * @see https://hl7.org/fhir/datatypes.html#markdown
 */

export interface MarkdownFormatterOptions {
  /** Default to original. */
  style?: "original" | "bareString" | "html" | null | undefined;
}

export const markdownFormatter: ValueFormatter<
  "markdown",
  string | null | undefined,
  MarkdownFormatterOptions | null | undefined
> = {
  type: "markdown",
  format: (value, options) => {
    if (!value) return "";

    switch (options?.style) {
      case "bareString": {
        return marked
          .parse(value, MARKED_OPTIONS)
          .replace(/<\/?[^>]+(>|$)/gi, "")
          .trim();
      }
      case "html": {
        return marked.parse(value, MARKED_OPTIONS).trim();
      }
      // eslint-disable-next-line unicorn/no-null
      case null:
      case undefined:
      case "original": {
        return value;
      }
    }
  },
};

const MARKED_OPTIONS = {
  mangle: false,
  headerIds: false,
};

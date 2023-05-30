import { ValueFormatter } from "../formatters.js";

export const fhirPathFormatter: ValueFormatter<
  "http://hl7.org/fhirpath/System.String",
  string,
  null | undefined
> = {
  type: "http://hl7.org/fhirpath/System.String",
  format: (value) => {
    return value?.trim() || "";
  },
};

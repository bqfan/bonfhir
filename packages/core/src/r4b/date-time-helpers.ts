/* eslint-disable @typescript-eslint/no-non-null-assertion */
/**
 * Return a FHIR date that expresses today's date.
 * Optionally, you can add the timezone to the function call.
 *
 * @fhirType date
 */
export function today(timeZone?: string | null | undefined): string {
  if (!timeZone) {
    return new Date().toISOString().slice(0, 10);
  }
  // Using Sweden locale is a good approximation of ISO format
  const formatter = new Intl.DateTimeFormat("sv-SE", {
    timeZone,
    dateStyle: "short",
    timeStyle: undefined,
  });
  return formatter.format(new Date());
}

/**
 * Return a FHIR dateTime that expresses the current date and time.
 * Default to UTC, but passing a timezone will compute the offset properly.
 *
 * @fhirType dateTime
 */
export function now(timeZone?: string | null | undefined): string {
  if (
    !timeZone ||
    timeZone.toLowerCase() === "utc" ||
    timeZone.toLowerCase() === "z"
  ) {
    return new Date().toISOString();
  }

  // Using Sweden locale is a good approximation of ISO format
  const formatter = new Intl.DateTimeFormat("sv-SE", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    fractionalSecondDigits: 3,
    timeZoneName: "longOffset",
  });
  const splitted = formatter.format(new Date()).split(" ");
  return `${splitted[0]}T${splitted[1]?.replace(",", ".")}${splitted[2]
    ?.replace("GMT", "")
    .replace("−", "-")}`;
}

// export function addDuration(value: string, duration: Duration): string {
//   const { year, month, day, timeWithTimezone } = value
//     .trim()
//     .match(
//       /^(?<year>\d(\d(\d[1-9]|[1-9]0)|[1-9]00)|[1-9]000)(-(?<month>0[1-9]|1[0-2])(-(?<day>0[1-9]|[12]\d|3[01]))?)?(T(?<timeWithTimezone>(?<hours>[01]\d|2[0-3]):(?<minutes>[0-5]\d):(?<seconds>[0-5]\d|60)(?<milliseconds>\.\d{1,9})?(?<timezone>Z|(\\+|-)((0\d|1[0-3]):[0-5]\d|14:00))))?$/
//     )?.groups as {
//     year?: string;
//     month?: string;
//     day?: string;
//     timeWithTimezone?: string;
//   };

//   if (!year) {
//     throw new Error(`Invalid date/dateTime/instant value: ${value}`);
//   }

//   let flavour;
//   if (timeWithTimezone) flavour = "full";
//   if (day) flavour ||= "year-month-day";
//   if (month) flavour ||= "year-month";
//   flavour ||= "year";

//   return value;
// }

export type FhirDateTime =
  | FhirDateTimeNA
  | FhirDateTimeYear
  | FhirDateTimeYearMonth
  | FhirDateTimeDate
  | FhirDateTimeDateTime;

export type FhirDateTimeFlavour = FhirDateTime["flavour"];

export interface FhirDateTimeNA {
  flavour: "NA";
}

export interface FhirDateTimeYear {
  flavour: "year";
  year: number;
  date: Date;
}

export interface FhirDateTimeYearMonth {
  flavour: "year-month";
  year: number;
  month: number;
  date: Date;
}

export interface FhirDateTimeDate {
  flavour: "date";
  year: number;
  month: number;
  day: number;
  date: Date;
}

export interface FhirDateTimeDateTime {
  flavour: "dateTime";
  year: number;
  month: number;
  day: number;
  hours: number;
  minutes: number;
  seconds: number;
  milliseconds: number | undefined;
  timeZone: string | undefined;
  date: Date;
}

export function parseFhirDateTime(
  value: string | null | undefined
): FhirDateTime {
  if (!value?.trim()) {
    return { flavour: "NA" };
  }

  const matchingData = value
    .trim()
    .match(
      /^(?<year>\d(\d(\d[1-9]|[1-9]0)|[1-9]00)|[1-9]000)(-(?<month>0[1-9]|1[0-2])(-(?<day>0[1-9]|[12]\d|3[01]))?)?([\sT](?<timeWithTimezone>(?<hours>[01]\d|2[0-3]):(?<minutes>[0-5]\d):(?<seconds>[0-5]\d|60)(?<milliseconds>\.\d{1,9})?(?<timeZone>Z|(\+|-)((0\d|1[0-3]):[0-5]\d|14:00))?))?$/
    )?.groups as {
    year?: string;
    month?: string;
    day?: string;
    hours?: string;
    minutes?: string;
    seconds?: string;
    milliseconds?: string;
    timeZone?: string;
    timeWithTimezone?: string;
  };

  if (!matchingData?.year) {
    return { flavour: "NA" };
  }

  const year = Number.parseInt(matchingData.year, 10);

  if (!matchingData.month) {
    return {
      flavour: "year",
      year,
      date: new Date(year, 0, 1),
    };
  }

  const month = Number.parseInt(matchingData.month, 10);

  if (!matchingData.day) {
    return {
      flavour: "year-month",
      year,
      month,
      date: new Date(year, month - 1, 1),
    };
  }

  const day = Number.parseInt(matchingData.day, 10);

  if (!matchingData.timeWithTimezone) {
    return {
      flavour: "date",
      year,
      month,
      day,
      date: new Date(year, month - 1, day),
    };
  }

  const hours = Number.parseInt(matchingData.hours!, 10);
  const minutes = Number.parseInt(matchingData.minutes!, 10);
  const seconds = Number.parseInt(matchingData.seconds!, 10);
  const milliseconds = Number.parseInt(
    matchingData.milliseconds?.slice(1) || "",
    10
  );

  return {
    flavour: "dateTime",
    year,
    month,
    day,
    hours,
    minutes,
    seconds,
    milliseconds: Number.isNaN(milliseconds) ? undefined : milliseconds,
    timeZone: matchingData.timeZone,
    date: new Date(value.trim()),
  };
}

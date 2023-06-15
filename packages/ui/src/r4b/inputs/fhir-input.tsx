import { AnyResourceType } from "@bonfhir/core/r4b";
import { ReactElement } from "react";
import {
  FhirInputBoolean,
  FhirInputBooleanProps,
  FhirInputContactPoint,
  FhirInputContactPointProps,
  FhirInputDate,
  FhirInputDateProps,
  FhirInputDateTime,
  FhirInputDateTimeProps,
  FhirInputHumanName,
  FhirInputHumanNameProps,
  FhirInputNumber,
  FhirInputNumberProps,
  FhirInputResource,
  FhirInputResourceProps,
  FhirInputString,
  FhirInputStringProps,
  FhirInputTerminology,
  FhirInputTerminologyProps,
} from "./input-types/index.js";

export function FhirInput<
  TRendererProps = any,
  TResourceType extends AnyResourceType = AnyResourceType
>(props: FhirInputProps<TRendererProps, TResourceType>): ReactElement | null {
  switch (props.type) {
    case "boolean": {
      return <FhirInputBoolean {...props} />;
    }
    case "ContactPoint": {
      return <FhirInputContactPoint {...props} />;
    }
    case "date": {
      return <FhirInputDate {...props} />;
    }
    case "dateTime":
    case "instant": {
      return <FhirInputDateTime {...props} />;
    }
    case "HumanName": {
      return <FhirInputHumanName {...props} />;
    }
    case "decimal":
    case "integer":
    case "integer64":
    case "positiveInt":
    case "unsignedInt": {
      return <FhirInputNumber {...props} />;
    }
    case "Resource":
    case "Reference": {
      return <FhirInputResource<TRendererProps, TResourceType> {...props} />;
    }
    case "string":
    case "canonical":
    case "id":
    case "oid":
    case "uri":
    case "url":
    case "uuid": {
      return <FhirInputString {...props} />;
    }
    case "code":
    case "Coding":
    case "CodeableConcept": {
      return <FhirInputTerminology {...props} />;
    }
    default: {
      throw new Error(`Unknown FhirInput type: ${(props as any).type}`);
    }
  }
}

export type FhirInputProps<
  TRendererProps = any,
  TResourceType extends AnyResourceType = AnyResourceType
> =
  | FhirInputBooleanProps<TRendererProps>
  | FhirInputContactPointProps<TRendererProps>
  | FhirInputDateProps<TRendererProps>
  | FhirInputDateTimeProps<TRendererProps>
  | FhirInputHumanNameProps<TRendererProps>
  | FhirInputNumberProps<TRendererProps>
  | FhirInputResourceProps<TRendererProps, TResourceType>
  | FhirInputStringProps<TRendererProps>
  | FhirInputTerminologyProps<TRendererProps>;
